export type RiskLevel = 'safe' | 'suspicious' | 'high' | 'critical'
export type Analysis = { score:number; level:RiskLevel; categories:string[]; reasons:{snippet:string; explanation:string; explanationHi:string; weight:number}[]; suggestedActions:{en:string; hi:string}[]; detectedLinks:string[] }
const rules:{category:string; weight:number; patterns:RegExp[]; explanation:string; explanationHi:string}[] = [
 {category:'Digital arrest / fake authority',weight:34,patterns:[/digital arrest|giraftaar|गिरफ्तार|cbi|ed officer|police officer|customs|ncb|money laundering|arrest warrant|drugs? found/i],explanation:'Impersonates authorities and uses fear to control you.',explanationHi:'अधिकारी बनकर डर और दबाव बनाया जा रहा है।'},
 {category:'Fake KYC / bank alert',weight:22,patterns:[/kyc|pan card|aadhaar|account (blocked|suspend|expire)|sim (block| बंद)|credit card points/i],explanation:'Creates a fake account emergency to steal personal or banking details.',explanationHi:'बैंक या KYC बंद होने का झूठा डर दिखाया गया है।'},
 {category:'OTP / UPI / remote access',weight:30,patterns:[/otp|upi pin|collect request|scan to receive|anydesk|teamviewer|quicksupport|share.*pin|pin.*share/i],explanation:'Requests secrets or remote access that can authorize a transaction.',explanationHi:'OTP, PIN या रिमोट एक्सेस मांगना धोखाधड़ी का संकेत है।'},
 {category:'Parcel / courier / customs',weight:24,patterns:[/parcel|courier|customs|drugs? in (your|the) parcel|fedex|dhl|india ?post/i],explanation:'Uses a package or customs story to demand money.',explanationHi:'पार्सल या कस्टम के नाम पर पैसे मांगे जा रहे हैं।'},
 {category:'Electricity / utility',weight:22,patterns:[/electricity|bijli|बिजली|gas bill|disconnection|disconnect.*meter|bill.*due/i],explanation:'Threatens utility disconnection to force an urgent payment.',explanationHi:'बिजली या गैस काटने की धमकी देकर तुरंत भुगतान मांगा गया है।'},
 {category:'Lottery / prize',weight:20,patterns:[/lottery|prize|kbc|gift|winner|इनाम|लॉटरी/i],explanation:'Unexpected prizes commonly require an advance fee or sensitive details.',explanationHi:'अचानक इनाम के लिए शुल्क या जानकारी मांगी जा सकती है।'},
 {category:'Job / investment task',weight:24,patterns:[/guaranteed returns|crypto|investment|part.?time|telegram task|task (job|scam)|daily income|double your money/i],explanation:'Promises easy money or guaranteed returns, a common scam pattern.',explanationHi:'आसान कमाई या गारंटीड रिटर्न का वादा संदिग्ध है।'},
 {category:'Malicious app or link',weight:28,patterns:[/\.apk\b|install this app|update (the )?app|download.*apk|click here|bit\.ly|tinyurl/i],explanation:'The link or app may steal credentials or take control of your device.',explanationHi:'लिंक या APK आपके फोन और जानकारी को जोखिम में डाल सकता है.'}
]
const urgency=/urgent|immediately|within \d+ minutes?|abhi|turant|तुरंत|अभी|जल्दी/i
const secrecy=/do not tell|don't tell|kisi ko mat bata|किसी को मत बताना|secret|गुप्त/i
const money=/send|pay|transfer|₹|rs\.?\s?\d+|rupees|paise|पैसे|rupay|upi/i
export function analyze(text:string):Analysis { const normalized=text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,' ').replace(/(.)\1{3,}/g,'$1$1').replace(/\s+/g,' ').trim(); const reasons:Analysis['reasons']=[]; const categories:string[]=[]; for(const r of rules){const m=normalized.match(r.patterns.find(p=>p.test(normalized))||/$^/); if(m){categories.push(r.category); reasons.push({snippet:m[0],explanation:r.explanation,explanationHi:r.explanationHi,weight:r.weight})}} if(urgency.test(normalized)) reasons.push({snippet:normalized.match(urgency)?.[0]||'',explanation:'High-pressure timing is used to stop careful thinking.',explanationHi:'तुरंत करने का दबाव सोचने का समय नहीं देता।',weight:14}); if(secrecy.test(normalized)) reasons.push({snippet:normalized.match(secrecy)?.[0]||'',explanation:'Isolation is a strong scam signal; real officials do not demand secrecy.',explanationHi:'गुप्त रखने की मांग धोखाधड़ी का मजबूत संकेत है।',weight:20}); if(money.test(normalized)&&reasons.length) reasons.push({snippet:normalized.match(money)?.[0]||'',explanation:'The message asks for money or payment details.',explanationHi:'संदेश में पैसे या भुगतान की मांग है।',weight:18}); const links=[...(normalized.match(/https?:\/\/[^\s]+|\b[\w.-]+\.(?:com|in|org|co|ly|apk)\b/gi)||[])]; const raw=Math.min(100,reasons.reduce((s,r)=>s+r.weight,0)); const score=Math.round(100*(1-Math.exp(-raw/65))); const level:RiskLevel=score>=82?'critical':score>=60?'high':score>=30?'suspicious':'safe'; return {score,level,categories:[...new Set(categories)],reasons,suggestedActions:[{en:'Do not share OTP, PIN, passwords or screen access.',hi:'OTP, PIN, पासवर्ड या स्क्रीन एक्सेस साझा न करें।'},{en:'Hang up and verify using an official number.',hi:'कॉल काटें और आधिकारिक नंबर से जांचें।'},{en:'Report cyber fraud on 1930.',hi:'साइबर धोखाधड़ी की शिकायत 1930 पर करें।'}],detectedLinks:links} }
export function maskSnippet(text:string){return text.slice(0,120).replace(/\d{4,}/g,'••••').replace(/https?:\/\/\S+/gi,'[link masked]')}
export const samples=[['Digital arrest · Hinglish','Main CBI officer bol raha hoon. Aapke naam par drugs ka parcel mila hai. Digital arrest se bachne ke liye abhi video call par rahiye aur kisi ko mat batana.'],['Fake KYC · Hindi','आपका बैंक KYC expire हो गया है। अकाउंट बंद होने से पहले इस लिंक पर PAN और OTP भेजें।'],['Electricity bill','Your electricity connection will be disconnected within 30 minutes. Pay ₹12,499 immediately on this UPI ID.'],['Courier scam','Customs notice: drugs found in your parcel. Call this number and pay the clearance fee now.'],['APK link','RTO challan pending. Install this APK to view your notice: https://bit.ly/rto-update.apk'],['Investment task','Earn ₹5,000 daily with our Telegram task and guaranteed crypto returns. Invest now.'],['Safe message','Hi, call me when you are free.'],['Safe OTP','Your OTP is 123456. Do not share it with anyone.'] ] as const
export default analyze

// URL helpers are intentionally exported from this module for offline testing.
export function extractSignals(text:string){return {urls:text.match(/https?:\/\/[^\s]+/gi)||[],phones:text.match(/\b[6-9]\d{9}\b/g)||[],upi:text.match(/[\w.-]+@[\w.-]+/g)||[]}}

// The detector is deliberately local-only: no fetch, storage, or model calls.
/* eslint-disable @typescript-eslint/no-unused-vars */
const _supportedLanguages=['en','hi','hinglish']
/* eslint-enable @typescript-eslint/no-unused-vars */

export function detectorTestVector(texts:string[]){return texts.map(analyze)}

// Re-export a tiny URL namespace for consumers that prefer a dedicated helper.
export const url={extract:extractSignals}

// Keep a stable named export for future test files.
export const detector={analyze,maskSnippet,samples}
