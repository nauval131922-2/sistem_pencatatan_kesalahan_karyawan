const baseUrl = "https://buyapercetakan.mdthoster.com/il/";

async function loginAndFetch() {
  const reqUrl = baseUrl + "v1/auth/login";
  const body = JSON.stringify({
    username: "nauval",
    password: "312admin2"
  });

  try {
    const res = await fetch(reqUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json; charset=utf-8",
        "X-Bismillah-Api-Key": "bismillah-m377-4j76-bb34-c450-7a62-ad3f"
      },
      body
    });

    const cookies = res.headers.get("set-cookie");
    const day = "01-02-2026"; 
    const reqData = {
        limit: 10,
        offset: 0,
        bsearch: { stgl_awal: day, stgl_akhir: day, ppn: "semua" }
    };
    
    const reqJson = encodeURIComponent(JSON.stringify(reqData));
    const dataUrl = baseUrl + "v1/prd/trprd_o/gr1?request=" + reqJson;
    
    const dataRes = await fetch(dataUrl, {
        method: "GET",
        headers: {
            "Accept": "application/json; charset=utf-8",
            "X-Bismillah-Api-Key": "bismillah-m377-4j76-bb34-c450-7a62-ad3f",
            "Cookie": cookies
        }
    });

    const dataJson = await dataRes.json();
    if(dataJson.records && dataJson.records.length > 0) {
      console.log(JSON.stringify(dataJson.records[0], null, 2));
    }
  } catch (e) {
    console.error(e);
  }
}
loginAndFetch();
