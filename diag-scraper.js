
const API_EMAIL = "nauval";
const API_PASSWORD = "312admin2";
const BASE_URL_DIGIT = "http://digit.pancatunggal.co.id:8000/";
const BASE_URL_MDTHOSTER = "https://buyapercetakan.mdthoster.com/il/";
const API_KEY = "bismillah-m377-4j76-bb34-c450-7a62-ad3f";

async function testLogin(baseUrl, label, useUsername = true) {
    console.log(`\n--- Testing ${label} (${baseUrl}) ---`);
    const loginUrl = baseUrl + "v1/auth/login";
    const body = useUsername 
        ? { username: API_EMAIL, password: API_PASSWORD }
        : { email: API_EMAIL, password: API_PASSWORD };
    
    console.log(`Body: ${JSON.stringify(body)}`);
    
    try {
        const res = await fetch(loginUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json; charset=utf-8",
                "X-Bismillah-Api-Key": API_KEY
            },
            body: JSON.stringify(body)
        });

        console.log(`Status: ${res.status}`);
        const text = await res.text();
        console.log(`Response: ${text.substring(0, 200)}...`);
        const cookies = res.headers.get("set-cookie");
        console.log(`Cookies: ${cookies ? "Found" : "NOT FOUND"}`);
        
        if (res.ok && cookies) {
            console.log("Success! Try fetching data...");
            const dataUrl = baseUrl + "v1/prd/trprd_o/gr1?request=" + encodeURIComponent(JSON.stringify({
                limit: 1,
                offset: 0,
                bsearch: { stgl_awal: "01-01-2025", stgl_akhir: "01-01-2025", ppn: "semua" }
            }));
            
            const dataRes = await fetch(dataUrl, {
                headers: {
                    "Accept": "application/json; charset=utf-8",
                    "X-Bismillah-Api-Key": API_KEY,
                    "Cookie": cookies
                }
            });
            console.log(`Data Status: ${dataRes.status}`);
            const dataText = await dataRes.text();
            console.log(`Data Response: ${dataText.substring(0, 200)}...`);
        }
    } catch (e) {
        console.error(`Error: ${e.message}`);
    }
}

async function runTests() {
    await testLogin(BASE_URL_DIGIT, "Pancatunggal with username", true);
    await testLogin(BASE_URL_DIGIT, "Pancatunggal with email", false);
    await testLogin(BASE_URL_MDTHOSTER, "Mdthoster with username", true);
    await testLogin(BASE_URL_MDTHOSTER, "Mdthoster with email", false);
}

runTests();
