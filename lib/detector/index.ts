export type RiskLevel = 'safe' | 'suspicious' | 'high' | 'critical'
export type Category = 'Digital arrest' | 'Fake KYC / bank' | 'OTP / UPI' | 'Parcel / courier' | 'Utility disconnection' | 'Lottery / prize' | 'Job / investment' | 'Malicious app'
export type Finding = { snippet: string; signal: string; weight: number; explanation: { en: string; hi: string } }
export type Detection = { score: number; level: RiskLevel; categories: Category[]; reasons: Finding[]; suggestedActions: { en: string; hi: string }[]; detectedLinks: string[]; normalized: string }

const groups: { category: Category; words: string[]; weight: number; explanation: string }[] = [
 { category:'Digital arrest', words:['digital arrest','cyber crime','cbi','ed','ncb','customs','police officer','arrest warrant','money laundering','drugs found','video call','giraftaar','गिरफ्तार','जांच अधिकारी','parcel me drugs'], weight:28, explanation:'Impersonates authorities or uses a digital-arrest story.' },
 { category:'Fake KYC / bank', words:['kyc expire','kyc update','kyc','account blocked','account will','pan update','aadhaar update','sim block','credit card points','बैंक खाता','केवाईसी','खाता बंद'], weight:22, explanation:'Creates fear around KYC, banking or identity details.' },
 { category:'OTP / UPI', words:['share otp','share it','otp batao','upi pin','collect request','scan to receive','scan this qr','anydesk','teamviewer','quicksupport','ओटीपी','यूपीआई पिन','otp dena'], weight:30, explanation:'Requests credentials, payment approval or remote access.' },
 { category:'Parcel / courier', words:['courier','parcel','customs duty','clearance fee','processing fee','delivery failed','drugs in parcel','drugs','fedex','dhl','कूरियर','पार्सल'], weight:20, explanation:'Uses a parcel or customs pretext.' },
 { category:'Utility disconnection', words:['electricity disconnected','power cut','bill pending','meter will be disconnected','bijli kat','बिजली कट','gas connection'], weight:20, explanation:'Threatens utility disconnection to force immediate payment.' },
 { category:'Lottery / prize', words:['you won','lottery','kbc winner','cash prize','gift voucher','winner','इनाम','लॉटरी','बधाई हो'], weight:20, explanation:'Promises an unexpected prize or reward.' },
 { category:'Job / investment', words:['part time task','telegram task','guaranteed return','double your money','crypto profit','investment opportunity','work from home','घर बैठे कमाई','गारंटीड रिटर्न'], weight:23, explanation:'Promises easy money, jobs or guaranteed returns.' },
 { category:'Malicious app', words:['.apk','install this app','update app','download application','rto challan','challan apk','एपीके'], weight:30, explanation:'Pushes an app or file that can steal access.' },
]

const signals = [
 { words:['immediately','urgent','today','pay now','right now','within 30 minutes','abhi','turant','तुरंत','अभी'], weight:14, signal:'urgency', explanation:'Pressures you to act before you can verify.' },
 { words:['do not tell anyone','stay on call','kisi ko mat batana','किसी को मत बताना','secret'], weight:18, signal:'secrecy', explanation:'Tries to isolate you from trusted people.' },
 { words:['pay','send money','transfer','fine','penalty','paise','पैसे','रुपये','payment'], weight:18, signal:'money request', explanation:'Requests money, a fine or a payment.' },
 { words:['otp','pin','password','pan number','aadhaar','account details'], weight:18, signal:'sensitive data', explanation:'Requests secrets or identity information.' },
]

function normalize(text:string){ return text.normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g,'').toLowerCase().replace(/(.)\1{2,}/g,'$1').replace(/\s+/g,' ').replace(/0tp/g,'otp').replace(/k\s*y\s*c/g,'kyc').trim() }

export function extractLinks(text:string){ return text.match(/(?:https?:\/\/|www\.)[^\s]+|\b[\w.-]+\.(?:com|in|net|org|xyz|top|click|site|apk)\b/gi) ?? [] }

function maskSnippet(text:string){ return text.slice(0,120).replace(/\d{4,}/g,'****').replace(/https?:\/\/[^\s]+/gi,'[link masked]') }

export function analyze(text:string):Detection {
 const normalized=normalize(text);
 const reasons:Finding[]=[];
 const categories:Category[]=[];
 const links=extractLinks(text);

 for(const group of groups){
 const hit=group.words.find(w=>normalized.includes(w));
 if(hit){
 categories.push(group.category);
 reasons.push({snippet:hit,signal:'category',weight:group.weight,explanation:{en:group.explanation,hi:'यह संदेश संदिग्ध कहानी या लालच का इस्तेमाल करता है।'}})
 }
 }

 for(const signal of signals){
 const hit=signal.words.find(w=>normalized.includes(w));
 if(hit) reasons.push({snippet:hit,signal:signal.signal,weight:signal.weight,explanation:{en:signal.explanation,hi:'यह आपको जल्दी या गुप्त रूप से कार्रवाई करने के लिए दबाव डालता है।'}})
 }

 for(const link of links){
 const suspicious=/\.(xyz|top|click|site|apk)(?:$|\/)/i.test(link)||/https?:\/\/(?:\d{1,3}\.){3}/.test(link);
 if(suspicious) reasons.push({snippet:link,signal:'suspicious link',weight:24,explanation:{en:'This link has a suspicious host or download type.',hi:'यह लिंक संदिग्ध वेबसाइट या डाउनलोड की ओर ले जाता है.'}})
 }

 let raw=reasons.reduce((sum,r)=>sum+r.weight,0);
 if(categories.length>=2) raw+=12;
 if(reasons.some(r=>r.signal==='secrecy')&&reasons.some(r=>r.signal==='money request')&&categories.includes('Digital arrest')) raw+=20;

 const score=Math.min(100,Math.round(100*(1-Math.exp(-raw/92))));
 const level:RiskLevel=score>=82?'critical':score>=62?'high':score>=30?'suspicious':'safe';
 const suggestedActions=level==='safe'?[{en:'No obvious scam signals. Still verify unexpected requests.',hi:'कोई स्पष्ट धोखाधड़ी संकेत नहीं। फिर भी अनपेक्षित अनुरोध जांचें।'}]:[{en:'Do not share OTP, PIN or passwords.',hi:'OTP, PIN या पासवर्ड साझा न करें।'},{en:'Hang up and call the official number yourself.',hi:'कॉल काटें और आधिकारिक नंबर पर खुद कॉल करें।'},{en:'Report suspicious cyber fraud on 1930.',hi:'साइबर धोखाधड़ी की शिकायत 1930 पर करें।'}];

 return {score,level,categories:[...new Set(categories)],reasons,suggestedActions,detectedLinks:links,normalized}
}

export function maskAlertSnippet(text:string){ return maskSnippet(text) }

export const sampleMessages=[
 ['Digital arrest · Hinglish','Main CBI officer bol raha hoon. Aapke parcel me drugs mile hain. Video call par rahiye, kisi ko mat batana, warna digital arrest hoga. Turant fine pay karo.'],
 ['KYC · Hindi','आपका बैंक KYC समाप्त हो गया है। खाता बंद होने से बचाने के लिए तुरंत PAN और OTP साझा करें।'],
 ['Electricity · Hinglish','Bijli bill pending hai. 30 minute mein connection cut ho jayega. Is link par payment karo.'],
 ['Courier · English','Customs found drugs in your parcel. Pay the clearance fee immediately or an arrest warrant will be issued.'],
 ['APK challan · Hinglish','RTO challan ke liye yeh APK install karo aur update app par tap karo.'],
 ['Investment · English','Guaranteed returns: double your money with this Telegram part-time task. Deposit today.'],
 ['Safe · English','Hi, call me when you are free.'],
 ['Safe OTP · English','Your OTP is 123456. Do not share it with anyone.']
] as const

export { normalize }
export type { Category as ScamCategory }
