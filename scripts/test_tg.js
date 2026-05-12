const TELEGRAM_TOKEN = '8722162859:AAFXVsi2rRNaqybfb4h5CeD9eFme-APzlFQ';
const TELEGRAM_CHAT_ID = '1294140235'; 

async function test() {
    const text = '이것은 테스트 메시지입니다.';
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    console.log('Sending to', url);
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text })
    });
    const data = await res.json();
    console.log('Response:', data);
}
test();
