const express = require('express')
const IprudClient = require('../src/lib')

const app = express()
const port = 3000
const publicKeyXML = "<RSAKeyValue><Modulus>AAAA+BBBBB/xx+C==</Modulus><Exponent>CCCCC</Exponent><P>AAAA</P><Q>FFFFF</Q><DP>DDDDD</DP><DQ>GGGGG</DQ><InverseQ>HHHHHH</InverseQ><D>AAAA</D></RSAKeyValue>";

const IClient = new IprudClient({
  baseUrl: "https://recycle.icicipruamc.com/Distributorsvcs/InvestorService.svc",
  publicKeyXml: publicKeyXML,
  consumerKey: "XXXXXX",
  consumerSecret: "YYYYYYYY"
});

app.get('/', (req, res) => res.json({ a: "helloworld" }))

app.get('/checkIMPSAllowed', (req, res) => {
    IClient.checkIMPSAllowed({
      FolioNo: 1,
      Scheme_Code: 'A',
      Source: 'DB',
      RedeemAmount: 1
    }).then(function(response){
      //console.log("response ***************", response);
      return res.send(response);
    }).catch(function(error){
      //console.log("error", error);
      return res.send(error);
    });
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
app.use(function (req, res, next) {
  res.header('Content-Type', 'application/json');
  next();
});
