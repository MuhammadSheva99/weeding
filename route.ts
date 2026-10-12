import { NextResponse } from "next/server";
import { checkFraud } from "@/lib/fraudDetection";
import { query } from "@/lib/db";
import { s3Client } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { writeFile, unlink, readFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

function getLogTime() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

async function convertAudioToM4a(inputPath: string, outputPath: string): Promise<void> {
  await execFileAsync("ffmpeg", [
    "-i", inputPath,
    "-c:a", "aac",
    "-b:a", "64k",
    "-ar", "44100",
    "-y",
    outputPath,
  ]);
}

const getFileExtension = (mimetype: string) => {
  if (mimetype.includes("pdf")) return "pdf";
  if (mimetype.includes("msword") || mimetype.includes("officedocument.wordprocessingml")) return "docx";
  if (mimetype.includes("excel") || mimetype.includes("officedocument.spreadsheetml")) return "xlsx";
  if (mimetype.includes("image/jpeg") || mimetype.includes("image/jpg")) return "jpg";
  if (mimetype.includes("image/png")) return "png";
  if (mimetype.includes("audio/ogg") || mimetype.includes("audio/mpeg")) return "ogg";
  if (mimetype.includes("video/mp4")) return "mp4";
  if (mimetype.includes("video/")) return "mp4";
  return mimetype.split("/")[1] || "bin";
};

const IGNORED_TYPES = new Set([
  'ChatPresence',
  'ReadReceipt',
  'Connected',
  'OfflineSyncPreview',
  'OfflineSyncCompleted',
  'HistorySync',
  'AppStateSyncComplete',
  'PushNameSetting',
  'MediaRetry',
  'UndecryptableMessage',
]);

function buildMinioUrl(filename: string): string {
  return filename;
}

function extractS3UrlFromEvent(info: any, msgData: any, childMsg: any): string | null {
  const fromInfo = info.MediaUrl || info.mediaUrl || info.S3Url || info.s3Url ||
    info.FileUrl || info.fileUrl || info.Url || info.url;
  if (fromInfo && (fromInfo.startsWith('http://') || fromInfo.startsWith('https://'))) {
    return fromInfo;
  }

  const mediaMsg = msgData.imageMessage || msgData.videoMessage ||
    msgData.audioMessage || msgData.documentMessage ||
    childMsg.imageMessage || childMsg.videoMessage ||
    childMsg.audioMessage || childMsg.documentMessage;

  if (mediaMsg) {
    const fromMedia = mediaMsg.S3Url || mediaMsg.s3Url || mediaMsg.MediaUrl ||
      mediaMsg.mediaUrl || mediaMsg.FileUrl || mediaMsg.fileUrl;
    if (fromMedia && (fromMedia.startsWith('http://') || fromMedia.startsWith('https://'))) {
      return fromMedia;
    }
  }

  return null;
}

function parseJid(raw: string): { number: string; isLid: boolean } {
  if (!raw) return { number: "", isLid: false };
  const isLid = raw.includes('@lid');
  const number = raw.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  return { number, isLid };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// AUTO FOLLOW-UP DETECT
// Dipanggil setiap marketing kirim pesan ke customer.
// Cek apakah pesan terakhir dari customer > 2 hari --- catat sebagai follow up.
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const FOLLOW_UP_THRESHOLD_MS = 1 * 24 * 60 * 60 * 1000; // 1 hari

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function tryAutoFollowUp(
  customerId: number,
  customerName: string,
  customerPhone: string,
  marketingId: number,
  time: string
): Promise<void> {
  try {
    // Cek pesan terakhir dari customer
    const lastMsgRes = await query(
      `SELECT created_at FROM crm_website.messages
       WHERE customer_id = $1 AND sender_type = 'customer'
       ORDER BY created_at DESC LIMIT 1`,
      [customerId]
    );

    if (lastMsgRes.rows.length === 0) {
      console.log(`[${time}] [FOLLOW-UP] Skip - belum ada balasan dari customer`);
      return;
    }

    const lastMsgTime = new Date(lastMsgRes.rows[0].created_at).getTime();
    const gapMs = Date.now() - lastMsgTime;
    const gapHours = Math.round(gapMs / 1000 / 60 / 60);

    if (gapMs < FOLLOW_UP_THRESHOLD_MS) {
      console.log(`[${time}] [FOLLOW-UP] Skip - gap hanya ${gapHours}h (< 48h)`);
      return;
    }

    const currentMonth = getCurrentMonth();

    // Anti-duplikasi: cek apakah sudah tercatat dalam 24 jam terakhir
    const dupRes = await query(
      `SELECT id FROM crm_website.kpi_follow_up
       WHERE marketing_id = $1
         AND phone = $2
         AND month = $3
         AND created_at >= NOW() - INTERVAL '24 hours'
       LIMIT 1`,
      [marketingId, customerPhone, currentMonth]
    );

    if (dupRes.rows.length > 0) {
      console.log(`[${time}] [FOLLOW-UP] Skip - sudah tercatat hari ini (id: ${dupRes.rows[0].id})`);
      return;
    }

    // Insert follow up otomatis
    const insertRes = await query(
      `INSERT INTO crm_website.kpi_follow_up
         (marketing_id, customer_name, phone, screenshot_url, month, source, created_at)
       VALUES ($1, $2, $3, NULL, $4, 'auto', NOW())
       RETURNING id`,
      [marketingId, customerName, customerPhone, currentMonth]
    );

    console.log(`[${time}] [FOLLOW-UP] --- AUTO recorded - ${customerName} (${customerPhone}) gap=${gapHours}h id=${insertRes.rows[0].id}`);

  } catch (err: any) {
    // Jangan sampai error follow-up mengganggu flow utama
    console.error(`[${time}] [FOLLOW-UP] Error (non-fatal):`, err.message);
  }
}

export async function POST(request: Request) {
  const time = getLogTime();

  try {
    const body = await request.json();
    const bodyType: string = body.type || "";

    console.log(`[${time}] WEBHOOK RECEIVED - Type: ${bodyType}`);

    if (IGNORED_TYPES.has(bodyType) || bodyType.includes('Latency')) {
      return NextResponse.json({ status: "ignored", type: bodyType });
    }

    if (bodyType === 'State' || bodyType === 'Connection' || bodyType === 'Disconnected') {
      const state = body.event?.state || body.state || (bodyType === 'Disconnected' ? 'disconnected' : "");
      let sessionName = body.name || body.instance_id || body.instanceName || body.instance || body.session;

      if (sessionName?.startsWith('token_')) {
        sessionName = sessionName.replace('token_', '');
      }

      console.log(`[${time}] STATE EVENT - Session: "${sessionName}", State: "${state}"`);

      if (!sessionName) {
        return NextResponse.json({ status: "ignored - no session" });
      }

      const isConnected = ['connected', 'open'].includes(state.toLowerCase());

      try {
        const result = await query(
          `UPDATE crm_website.users SET connection_status = $1 WHERE wuzapi_session = $2`,
          [isConnected ? 'connected' : 'disconnected', sessionName]
        );
        console.log(`[${time}] DB Updated - Rows affected: ${result.rowCount}`);
        if (result.rowCount === 0) {
          console.log(`[${time}] WARNING: No user found with wuzapi_session: "${sessionName}"`);
        }
        return NextResponse.json({ status: "status_updated", session: sessionName, connected: isConnected });
      } catch (dbErr: any) {
        console.error(`[${time}] DB Update Error:`, dbErr.message);
        return NextResponse.json({ error: dbErr.message }, { status: 500 });
      }
    }

    try {
      await processWebhook(body, time);
      return NextResponse.json({ status: "processed", timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.error(`[${time}] PROCESSING ERROR:`, err.message);
      return NextResponse.json({ status: "error", error: err.message }, { status: 500 });
    }

  } catch (error: any) {
    console.error(`[${time}] WEBHOOK PARSE ERROR:`, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function downloadMediaWithRetry(
  wuzapiUrl: string,
  endpoint: string,
  userToken: string,
  mediaObject: any,
  fileSize: number,
  time: string
): Promise<any> {
  const MAX_RETRIES = 3;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[${time}] [DOWNLOAD] Attempt ${attempt}/${MAX_RETRIES} via ${wuzapiUrl}/chat/${endpoint}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const resDownload = await fetch(`${wuzapiUrl}/chat/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'token': userToken },
        body: JSON.stringify({
          "Url": mediaObject.URL || mediaObject.url,
          "DirectPath": mediaObject.directPath || mediaObject.DirectPath,
          "MediaKey": mediaObject.mediaKey || mediaObject.MediaKey,
          "Mimetype": mediaObject.mimetype || mediaObject.Mimetype,
          "FileEncSHA256": mediaObject.fileEncSHA256 || mediaObject.FileEncSHA256,
          "FileSHA256": mediaObject.fileSHA256 || mediaObject.FileSHA256,
          "FileLength": fileSize
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const downloadData = await resDownload.json();
      console.log(`[${time}] [DOWNLOAD] Attempt ${attempt} - status=${resDownload.status}, success=${downloadData.success}`);

      if (downloadData.success) {
        console.log(`[${time}] [DOWNLOAD] Success on attempt ${attempt}`);
        return downloadData;
      }

      console.log(`[${time}] [DOWNLOAD] Attempt ${attempt} failed: ${JSON.stringify(downloadData).substring(0, 200)}`);

    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.log(`[${time}] [DOWNLOAD] Attempt ${attempt} timeout`);
      } else {
        console.log(`[${time}] [DOWNLOAD] Attempt ${attempt} error: ${err.message}`);
      }
    }

    if (attempt < MAX_RETRIES) {
      const waitMs = 2000 * attempt;
      console.log(`[${time}] [DOWNLOAD] Waiting ${waitMs}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }

  return null;
}

async function processWebhook(body: any, initialTime: string) {
  const time = getLogTime();
  console.log(`[${time}] ========================================`);
  console.log(`[${time}] PROCESSING STARTED`);

  const WUZAPI_URL = process.env.WUZAPI_URL || "https://wuzapi.ibmpgroup.com";

  let sessionName = body.name || body.instance_id || body.instanceName || body.instance || body.session;
  if (sessionName?.startsWith('token_')) {
    sessionName = sessionName.replace('token_', '');
    console.log(`[${time}] Session cleaned: "${sessionName}"`);
  } else {
    console.log(`[${time}] Session Name: ${sessionName}`);
  }

  const USER_TOKEN = `token_${sessionName}`;

  let targetMarketingId = null;
  if (sessionName) {
    try {
      const userResult = await query(
        `SELECT id, username FROM crm_website.users WHERE wuzapi_session = $1 LIMIT 1`,
        [sessionName]
      );
      if (userResult.rows.length > 0) {
        targetMarketingId = userResult.rows[0].id;
        console.log(`[${time}] [OK] Marketing Found - ID: ${targetMarketingId}, Username: ${userResult.rows[0].username}`);
      } else {
        console.log(`[${time}] [FAIL] Session tidak ditemukan di database: "${sessionName}"`);
      }
    } catch (err: any) {
      console.error(`[${time}] Error getting marketing_id:`, err.message);
    }
  }

  if (!targetMarketingId) {
    console.log(`[${time}] [WARN] SKIPPING - No marketing_id`);
    return;
  }

  const event = body.event || {};
  const info = event.Info || {};
  const msgData = event.Message || {};
  const childMsg = msgData.associatedChildMessage?.message || {};

  console.log(`[${time}] Body Type: ${body.type}`);
  console.log(`[${time}] INFO MEDIATYPE: "${info.MediaType}"`);
  console.log(`[${time}] INFO MEDIAURL: "${info.MediaUrl || info.mediaUrl || info.S3Url || "-"}"`);
  console.log(`[${time}] imageMessage: ${msgData.imageMessage || childMsg.imageMessage ? "ADA" : "NULL"}`);
  console.log(`[${time}] audioMessage: ${msgData.audioMessage || childMsg.audioMessage ? "ADA" : "NULL"}`);
  console.log(`[${time}] videoMessage: ${msgData.videoMessage || childMsg.videoMessage ? "ADA" : "NULL"}`);
  console.log(`[${time}] documentMessage: ${msgData.documentMessage || childMsg.documentMessage ? "ADA" : "NULL"}`);
  console.log(`[${time}] info.IsFromMe: ${info.IsFromMe}, info.Sender: ${info.Sender}, info.Chat: ${info.Chat}`);

  const mediaType = info.MediaType || "";
  if (mediaType && mediaType !== "" && mediaType !== "url") {
    console.log(`[${time}] FULL EVENT JSON (media):`, JSON.stringify(event).substring(0, 2000));
  }

  const isFromMe = info.IsFromMe || event.IsFromMe || false;
  const isCallEvent = (body.type?.includes('Call') || !!event.CallID) && !body.type?.includes('Latency');

  const chatId = info.Chat || event.Chat || "";

  if (chatId.includes("@status.broadcast") || chatId === "status@broadcast") {
    console.log(`[${time}] SKIPPED - WhatsApp Status ignored`);
    return;
  }

  if (chatId.includes("@g.us")) {
    console.log(`[${time}] SKIPPED - Group chat ignored: ${chatId}`);
    return;
  }

  let pesanMasuk = msgData.conversation || msgData.extendedTextMessage?.text ||
    msgData.imageMessage?.caption || msgData.documentMessage?.title ||
    msgData.videoMessage?.caption ||
    childMsg.imageMessage?.caption || childMsg.videoMessage?.caption ||
    childMsg.documentMessage?.title || "";

  if (!pesanMasuk) {
    if (mediaType === "image") pesanMasuk = "[Gambar]";
    else if (mediaType === "video") pesanMasuk = "[Video]";
    else if (mediaType === "audio") pesanMasuk = "[Pesan Suara]";
    else if (mediaType === "document") pesanMasuk = "[Dokumen]";
  }

  console.log(`[${time}] Message Text: "${pesanMasuk}"`);

  let whatsappId = info.ID || info.Id || event.CallID || body.call?.id;
  let callDuration = 0;
  let isAcceptedElsewhere = false;

  const rawSender = isFromMe
    ? (info.Chat || event.Chat || event.To || "")
    : (info.Sender || event.From || body.call?.from || "");

  const rawSenderAlt = isFromMe
    ? (info.Chat?.includes('@lid') ? (info.RemoteJid || event.To || "") : "")
    : (info.SenderAlt || event.CallCreator || "");

  console.log(`[${time}] Raw Sender: "${rawSender}", Raw SenderAlt: "${rawSenderAlt}"`);

  const parsed = parseJid(rawSender);
  const parsedAlt = parseJid(rawSenderAlt);

  let phoneNumber = !parsed.isLid ? parsed.number : (!parsedAlt.isLid ? parsedAlt.number : "");
  let lidNumber = parsed.isLid ? parsed.number : (parsedAlt.isLid ? parsedAlt.number : "");

  const senderIsLid = parsed.isLid;
  const senderAltIsLid = parsedAlt.isLid;

  if (!phoneNumber && lidNumber && isCallEvent) {
    const altSources = [
      event.Participant, event.participant, body.call?.participant, info.RemoteJid, info.Participant
    ].filter(Boolean);
    for (const alt of altSources) {
      if (alt && !alt.includes('@lid')) {
        phoneNumber = parseJid(alt).number;
        console.log(`[${time}] [CALL] Phone fallback from alt source: ${phoneNumber}`);
        break;
      }
    }
  }

  const hasRealPhone = !!phoneNumber;
  const finalPhone = hasRealPhone ? phoneNumber : lidNumber;
  const finalLid = lidNumber || null;

  console.log(`[${time}] Phone: "${phoneNumber}", LID: "${lidNumber}", hasRealPhone: ${hasRealPhone}`);

  if (isCallEvent) {
    const callStatus = body.type;
    const reason = event.Reason || event.Data?.Attrs?.reason || "";
    callDuration = body.call?.duration || event.Duration || 0;

    const statusPenting = ['CallTerminate', 'CallAccept', 'CallOffer', 'CallMissed'];
    if (!statusPenting.includes(callStatus)) {
      console.log(`[${time}] Call status "${callStatus}" ignored`);
      return;
    }

    const arah = isFromMe ? "Keluar" : "Masuk";
    isAcceptedElsewhere = (reason === 'accepted_elsewhere' && callStatus === 'CallTerminate');

    if (callStatus === 'CallOffer') pesanMasuk = `[CALL] Panggilan ${arah}: Memanggil...`;
    else if (callStatus === 'CallAccept') pesanMasuk = `[CALL] Panggilan ${arah}: Tersambung`;
    else if (callStatus === 'CallTerminate') pesanMasuk = `[CALL] Panggilan ${arah}: Diproses...`;
    else if (callStatus === 'CallMissed') pesanMasuk = `[CALL] Panggilan ${arah}: Tidak Terjawab`;

    whatsappId = event.CallID || body.call?.id || `CALL_${Date.now()}`;
  }

  // ------ REVOKE / DELETE MESSAGE HANDLER ------------------------------------------------------------------------------------------------------------------
  const protocolMsg = msgData.protocolMessage;
  if (protocolMsg && (protocolMsg.type === 0 || protocolMsg.type === 'REVOKE')) {
    const revokedId = protocolMsg.key?.id || protocolMsg.Key?.Id;
    if (revokedId) {
      await query(`DELETE FROM crm_website.messages WHERE id_whatsapp = $1`, [revokedId]);
      console.log(`[${time}] [DELETE] Message revoked: ${revokedId}`);
      return;
    }
  }

  // ------ EDIT MESSAGE HANDLER ------------------------------------------------------------------------------------------------------------------------------------------------------
  const isEditProtocol = protocolMsg?.type === 14 || protocolMsg?.type === 'MESSAGE_EDIT';
  const editedMsg = msgData.editedMessage || protocolMsg?.editedMessage || childMsg.editedMessage;

  if (isEditProtocol || editedMsg) {
    const editedId = protocolMsg?.key?.id || protocolMsg?.Key?.Id
      || msgData.editedMessage?.key?.id || msgData.editMessage?.key?.id;
    const newText = editedMsg?.conversation
      || editedMsg?.extendedTextMessage?.text
      || protocolMsg?.editedMessage?.conversation
      || protocolMsg?.editedMessage?.extendedTextMessage?.text
      || "";

    if (editedId && newText) {
      await query(
        `UPDATE crm_website.messages SET message_text = $1, is_edited = true WHERE id_whatsapp = $2`,
        [newText, editedId]
      );
      console.log(`[${time}] [EDIT] Message edited: ${editedId} --- "${newText}"`);
      return;
    }

    console.log(`[${time}] [EDIT] Edit event detected but missing ID or text, skipping`);
    return;
  }

  const mediaObject = msgData.imageMessage || msgData.documentMessage ||
    msgData.videoMessage || msgData.audioMessage ||
    childMsg.imageMessage || childMsg.documentMessage ||
    childMsg.videoMessage || childMsg.audioMessage;

  let fileUrl: string | null = null;

  if (mediaObject || mediaType) {
    const mimetype = mediaObject?.mimetype || mediaObject?.Mimetype || "";
    const s3UrlFromWuzapi = extractS3UrlFromEvent(info, msgData, childMsg);

    if (s3UrlFromWuzapi) {
      const urlParts = s3UrlFromWuzapi.split('/');
      fileUrl = urlParts[urlParts.length - 1];
      console.log(`[${time}] [OK] Media filename from WuzAPI S3: ${fileUrl}`);

      if (!pesanMasuk) {
        if (mediaType === "audio") pesanMasuk = "[Pesan Suara]";
        else if (mediaType === "video") pesanMasuk = "[Video]";
        else if (mediaType === "document") pesanMasuk = "[Dokumen]";
        else pesanMasuk = "[Gambar]";
      }
    } else if (mediaObject) {
      console.log(`[${time}] [MEDIA] Media object detected, attempting download`);
      console.log(`[${time}] [MEDIA] Mimetype: ${mimetype}`);
      console.log(`[${time}] [MEDIA] FileLength: ${mediaObject.fileLength || mediaObject.FileLength}`);
      console.log(`[${time}] [MEDIA] URL exists: ${!!(mediaObject.URL || mediaObject.url)}`);
      console.log(`[${time}] [MEDIA] DirectPath exists: ${!!(mediaObject.directPath || mediaObject.DirectPath)}`);

      try {
        const fileSize = Number(mediaObject.fileLength || mediaObject.FileLength || 0);
        const MAX_SIZE = 50 * 1024 * 1024;

        if (fileSize > MAX_SIZE) {
          console.log(`[${time}] [MEDIA] File too large: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
          pesanMasuk = pesanMasuk || "[File terlalu besar]";
        } else if (!mediaObject.URL && !mediaObject.url && !mediaObject.directPath && !mediaObject.DirectPath) {
          console.log(`[${time}] [MEDIA] No URL/DirectPath available, skipping download`);
          if (!pesanMasuk) {
            if (msgData.audioMessage || childMsg.audioMessage) pesanMasuk = "[Pesan Suara]";
            else if (msgData.videoMessage || childMsg.videoMessage) pesanMasuk = "[Video]";
            else if (msgData.documentMessage || childMsg.documentMessage) pesanMasuk = "[Dokumen]";
            else pesanMasuk = "[Gambar]";
          }
        } else {
          const isDoc = !!(msgData.documentMessage || childMsg.documentMessage);
          const isAudio = !!(msgData.audioMessage || childMsg.audioMessage);
          const isVideo = !!(msgData.videoMessage || childMsg.videoMessage);

          let endpoint = 'downloadimage';
          if (isDoc) endpoint = 'downloaddocument';
          else if (isAudio) endpoint = 'downloadaudio';
          else if (isVideo) endpoint = 'downloadvideo';

          const downloadData = await downloadMediaWithRetry(
            WUZAPI_URL, endpoint, USER_TOKEN, mediaObject, fileSize, time
          );

          if (downloadData?.success) {
            const base64Raw = downloadData.data?.Data || downloadData.data || downloadData.Data;

            if (base64Raw) {
              const cleanBase64 = base64Raw.includes('base64,')
                ? base64Raw.split('base64,').pop()
                : base64Raw;
              const originalBuffer = Buffer.from(cleanBase64, 'base64');
              const timestamp = Date.now();

              if (isAudio) {
                const tempFiles: string[] = [];
                try {
                  const ext = getFileExtension(mimetype);
                  const tmpInput = join(tmpdir(), `wa_audio_in_${timestamp}.${ext}`);
                  const tmpOutput = join(tmpdir(), `wa_audio_out_${timestamp}.m4a`);
                  tempFiles.push(tmpInput, tmpOutput);

                  await writeFile(tmpInput, originalBuffer);
                  await convertAudioToM4a(tmpInput, tmpOutput);
                  const convertedBuffer = await readFile(tmpOutput);

                  const m4aFileName = `${timestamp}_wa_voice.m4a`;
                  await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.MINIO_BUCKET || "crmweb",
                    Key: m4aFileName,
                    Body: convertedBuffer,
                    ContentType: "audio/mp4",
                  }));

                  fileUrl = buildMinioUrl(m4aFileName);
                  console.log(`[${time}] [OK] Audio converted to m4a: ${fileUrl}`);
                } catch (convErr: any) {
                  console.error(`[${time}] [WARN] Audio conversion failed, saving original:`, convErr.message);
                  const ext = getFileExtension(mimetype);
                  const fallbackFileName = `${timestamp}_file.${ext}`;
                  await s3Client.send(new PutObjectCommand({
                    Bucket: process.env.MINIO_BUCKET || "crmweb",
                    Key: fallbackFileName,
                    Body: originalBuffer,
                    ContentType: mimetype || 'application/octet-stream',
                  }));
                  fileUrl = buildMinioUrl(fallbackFileName);
                  console.log(`[${time}] [OK] Audio fallback saved: ${fileUrl}`);
                } finally {
                  for (const f of tempFiles) await unlink(f).catch(() => {});
                }
              } else {
                const ext = getFileExtension(mimetype);
                const safeFileName = `${timestamp}_file.${ext}`;
                await s3Client.send(new PutObjectCommand({
                  Bucket: process.env.MINIO_BUCKET || "crmweb",
                  Key: safeFileName,
                  Body: originalBuffer,
                  ContentType: mimetype || 'application/octet-stream',
                }));
                fileUrl = buildMinioUrl(safeFileName);
                console.log(`[${time}] [OK] Media saved to MinIO: ${fileUrl}`);
              }

              if (!pesanMasuk) {
                if (isAudio) pesanMasuk = "[Pesan Suara]";
                else if (isVideo) pesanMasuk = "[Video]";
                else if (isDoc) pesanMasuk = "[Dokumen]";
                else pesanMasuk = "[Gambar]";
              }
            } else {
              console.error(`[${time}] [MEDIA] Download success but base64 data is empty`);
              pesanMasuk = pesanMasuk || "[Gagal membaca media]";
            }
          } else {
            console.error(`[${time}] [FAIL] All download attempts failed`);
            pesanMasuk = pesanMasuk || "[Gagal mengunduh media]";
          }
        }
      } catch (err: any) {
        console.error(`[${time}] Media error:`, err.message);
        pesanMasuk = pesanMasuk || "[Error memproses media]";
      }
    }
  }

  if (!pesanMasuk && !fileUrl && !isCallEvent) {
    console.log(`[${time}] SKIPPED - Empty message and no media`);
    return;
  }

  const pushName = info.PushName || (isCallEvent ? "WhatsApp Caller" : "Customer");

  console.log(`[${time}] === FINAL VALUES ===`);
  console.log(`[${time}] Phone: ${finalPhone}, LID: ${finalLid}, hasRealPhone: ${hasRealPhone}, Name: ${pushName}`);
  console.log(`[${time}] Marketing ID: ${targetMarketingId}, isFromMe: ${isFromMe}`);
  console.log(`[${time}] Message: "${pesanMasuk}", fileUrl: ${fileUrl}, WA ID: ${whatsappId}`);

  if (!finalPhone && !pesanMasuk && !fileUrl && !whatsappId) {
    console.log(`[${time}] [WARN] SKIPPED - Missing sender or message`);
    return;
  }

  try {
    let customerId: number | undefined;

    if (isCallEvent) {
      const existingCall = await query(
        `SELECT customer_id FROM crm_website.messages WHERE id_whatsapp = $1 LIMIT 1`, [whatsappId]
      );
      if (existingCall.rows.length > 0) {
        customerId = existingCall.rows[0].customer_id;
        console.log(`[${time}] Existing call, Customer ID: ${customerId}`);
      }
    }

    if (!customerId) {
      const checkCust = await query(
        `SELECT id, phone_number, whatsapp_lid, full_name FROM crm_website.customers 
         WHERE phone_number = $1 OR whatsapp_lid = $1
            OR ($2 != '' AND (phone_number = $2 OR whatsapp_lid = $2))
         LIMIT 1`,
        [finalPhone, finalLid || ""]
      );

      if (checkCust.rows.length > 0) {
        const found = checkCust.rows[0];
        customerId = found.id;
        console.log(`[${time}] [OK] Customer found - ID: ${customerId}, Name: ${found.full_name}`);

        if (finalLid && !found.whatsapp_lid) {
          await query(
            `UPDATE crm_website.customers SET whatsapp_lid = $1, marketing_id = $2, last_interaction = NOW() WHERE id = $3`,
            [finalLid, targetMarketingId, customerId]
          );
          console.log(`[${time}] [OK] LID updated: ${finalLid}`);
        } else if (hasRealPhone && found.phone_number === found.whatsapp_lid) {
          await query(
            `UPDATE crm_website.customers SET phone_number = $1, marketing_id = $2, last_interaction = NOW() WHERE id = $3`,
            [finalPhone, targetMarketingId, customerId]
          );
          console.log(`[${time}] [OK] Phone number corrected: ${finalPhone}`);
        } else {
          await query(
            `UPDATE crm_website.customers SET last_interaction = NOW(), marketing_id = $1 WHERE id = $2`,
            [targetMarketingId, customerId]
          );
        }
      } else {
        if (!hasRealPhone) {
          console.log(`[${time}] [WARN] No real phone number, storing LID as phone_number sementara: ${finalPhone}`);
        }

        console.log(`[${time}] Creating new customer - Phone: ${finalPhone}, LID: ${finalLid}, Name: ${pushName}`);
        const insertRes = await query(
          `INSERT INTO crm_website.customers (phone_number, whatsapp_lid, full_name, source, marketing_id)
           VALUES ($1, $2, $3, 'WhatsApp', $4) RETURNING id`,
          [finalPhone, finalLid, pushName, targetMarketingId]
        );
        customerId = insertRes.rows[0].id;
        console.log(`[${time}] [OK] New customer created - ID: ${customerId}`);
      }
    }

    const senderType = isFromMe ? 'marketing' : 'customer';

    if (isCallEvent) {
      const arah = isFromMe ? "Keluar" : "Masuk";
      const callStatus = body.type;

      const existingMsg = await query(
        `SELECT id, call_started_at, message_text FROM crm_website.messages 
         WHERE id_whatsapp = $1 LIMIT 1`,
        [whatsappId]
      );

      if (existingMsg.rows.length > 0) {
        const msgFound = existingMsg.rows[0];

        if (callStatus === 'CallAccept') {
          if (!msgFound.message_text?.includes('Selesai')) {
            await query(
              `UPDATE crm_website.messages SET message_text = $1, call_started_at = NOW() WHERE id = $2`,
              [`[CALL] Panggilan ${arah}: Tersambung`, msgFound.id]
            );
          }
        } else if (callStatus === 'CallTerminate' || isAcceptedElsewhere) {
          if (isAcceptedElsewhere) {
            if (!msgFound.call_started_at) {
              await query(
                `UPDATE crm_website.messages SET call_started_at = NOW() WHERE id = $1`,
                [msgFound.id]
              );
            }
            return;
          }

          const callStarted = msgFound.call_started_at;
          let calculatedDuration = 0;

          if (callDuration > 0) {
            calculatedDuration = callDuration;
          } else if (callStarted) {
            calculatedDuration = Math.floor((Date.now() - new Date(callStarted).getTime()) / 1000);
          }

          let finalText: string;
          if (calculatedDuration > 0) {
            const mins = Math.floor(calculatedDuration / 60);
            const secs = calculatedDuration % 60;
            finalText = `[CALL] Panggilan ${arah}: Selesai (${mins}:${secs.toString().padStart(2, '0')})`;
          } else {
            finalText = `[CALL] Panggilan ${arah}: Tidak Terjawab`;
          }

          await query(
            `UPDATE crm_website.messages SET message_text = $1, call_duration = $2 WHERE id = $3`,
            [finalText, calculatedDuration, msgFound.id]
          );
        } else if (callStatus === 'CallMissed') {
          await query(
            `UPDATE crm_website.messages SET message_text = $1 WHERE id = $2`,
            [`[CALL] Panggilan ${arah}: Tidak Terjawab`, msgFound.id]
          );
        }
      } else {
        await query(
          `INSERT INTO crm_website.messages (customer_id, sender_type, message_text, image_url, id_whatsapp, marketing_id, call_duration)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [customerId, senderType, pesanMasuk, fileUrl, whatsappId, targetMarketingId, 0]
        );
      }
    } else {
      await query(
        `INSERT INTO crm_website.messages (customer_id, sender_type, message_text, image_url, id_whatsapp, marketing_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id_whatsapp) DO UPDATE
           SET message_text = CASE
                 WHEN crm_website.messages.message_text = '' OR crm_website.messages.message_text IS NULL
                 THEN EXCLUDED.message_text
                 ELSE crm_website.messages.message_text
               END,
               image_url = COALESCE(EXCLUDED.image_url, crm_website.messages.image_url)`,
        [customerId, senderType, pesanMasuk, fileUrl, whatsappId, targetMarketingId]
      );

      if (isFromMe && customerId) {
        // Mark customer messages as read
        await query(
          `UPDATE crm_website.messages 
           SET is_read = true
           WHERE customer_id = $1 
           AND marketing_id = $2
           AND sender_type = 'customer'
           AND (is_read = false OR is_read IS NULL)`,
          [customerId, targetMarketingId]
        );
        console.log(`[${time}] [OK] Messages marked as read - Customer: ${customerId}`);

        // ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        // AUTO FOLLOW-UP: marketing kirim pesan --- cek gap dari customer
        // Jalankan non-blocking, error tidak mengganggu flow utama
        // ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
        const customerName = (await query(
          `SELECT full_name FROM crm_website.customers WHERE id = $1`,
          [customerId]
        )).rows[0]?.full_name || pushName;

        tryAutoFollowUp(
          customerId,
          customerName,
          finalPhone,
          targetMarketingId,
          time
        ); // sengaja tidak di-await -> non-blocking

        // FRAUD DETECTION: cek rekening pribadi di pesan marketing
        if (pesanMasuk && typeof pesanMasuk === "string") {
          checkFraud(pesanMasuk, targetMarketingId, customerId)
            .then(result => {
              if (result.isFraud) {
                console.log(`[${time}] [FRAUD] Rekening mencurigakan marketing ${targetMarketingId}: ${result.suspiciousNumbers.join(", ")}`)
              }
            })
            .catch(err => console.error(`[${time}] [FRAUD] Error:`, err.message))
        }
      }

      console.log(`[${time}] [OK] Message saved! (type: ${body.type}, media: ${fileUrl ? "YES - " + fileUrl : "NO"})`);
    }
    console.log(`[${time}] [OK] PROCESSING COMPLETED`);
    console.log(`[${time}] ========================================`);

  } catch (dbErr: any) {
    console.error(`[${time}] DB ERROR:`, dbErr.message);
    throw dbErr;
  }
}