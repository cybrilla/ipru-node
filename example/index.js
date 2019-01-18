const express = require('express')
const IprudClient = require('../src/lib')

const app = express()
const port = 3000
const publicKeyXML = "YOUR PUBLIC KEY XML HERE";

const IClient = new IprudClient({
  baseUrl: "https://recycle.icicipruamc.com/Distributorsvcs/InvestorService.svc",
  publicKeyXml: publicKeyXML,
  consumerKey: "<>consumerKey<>",
  consumerSecret: "<>consumerSecret<>"
});

app.get('/', (req, res) => res.json({ a: "helloworld" }))

app.get('/checkIMPSAllowed', (req, res) => {
    IClient.checkIMPSAllowed({
      FolioNo: "",
      Scheme_Code: '',
      Source: '',
      RedeemAmount: ''
    }).then(function(response){
      console.log("response ***************", response);
      return res.send(response);
    }).catch(function(error){
      console.log("error", error);
      return res.send(error);
    });
});


app.listen(port, () => console.log(`Example app listening on port ${port}!`))
app.use(function (req, res, next) {
  res.header('Content-Type', 'application/json');
  next();
});
