const { stripIndents, oneLine } = require("common-tags");
const moment = require("moment");
const { ms } = require("@naval-base/ms");
const axios = require("axios");

module.exports = class Premium {
  static async init() {
    const fetchPatreonData = async (data, included, url) => {
      const resp = await axios.request({
        url: url,
        method: "get",
        headers: { Authorization: `Bearer ${process.env.PATREON_TOKEN}`.toString() },
      });
      data = data.concat(resp.data.data);
      included = included.concat(resp.data.included);
      url = resp.data.links ? resp.data.links.next : null;
      if (url) return await fetchPatreonData(data, included, url);
      return {
        data: data,
        included: included,
      };
    };
    const data = await fetchPatreonData(
      [],
      [],
      "https://www.patreon.com/api/oauth2/v2/campaigns/1017729/members?include=currently_entitled_tiers,user&fields%5Btier%5D=amount_cents,created_at,patron_count,published,published_at,title,url&fields%5Buser%5D=full_name,vanity,social_connections&fields%5Bmember%5D=full_name,last_charge_date,last_charge_status,lifetime_support_cents,currently_entitled_amount_cents,patron_status,pledge_relationship_start,will_pay_amount_cents"
    );

    console.log(data.data.length);
    console.log(data.included.length);

    // Next step is to sort data into Currently Paying, Expired and Denied patrons AS WELL AS link the discord ID part of the BS.
    // If no discord id is there, then what? I think just don't do anything. maybe?
  }
};
