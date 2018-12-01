const request = require('request');
const parser = require('xml2json');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());

const trainHttpRequest = (station, res) => {
  let url = 'http://api.irishrail.ie/realtime/realtime.asmx/getStationDataByNameXML?StationDesc=' + station + '&NumMin=60'
  request({
    url: url,
    json: true,
    headers: {
      'Access-Control-Allow-Origin': true
    }
  }, (error, response, body) => {
    if (error) {
      res.send(error);
    }
    let parsedResponse = parser.toJson(body);
    let responseAsJs = JSON.parse(parsedResponse);
    let responseSubset = responseAsJs.ArrayOfObjStationData.objStationData;
    if (responseSubset) {
      const mappedTrains = {
        stationCode: responseSubset[0].Stationcode,
        stationFullname: responseSubset[0].Stationfullname,
        items: responseSubset.map(item => {
          const { Stationcode, Stationfullname, ...newItem } = item;
          return newItem;
        })
      }
      res.send(mappedTrains);
    } else {
      res.send({message: 'No data at this time'});
    }
  })
}

const luasHttpRequest = (station, res) => {
  let url = 'http://luasforecasts.rpa.ie/xml/get.ashx?action=forecast&stop=' + station + '&encrypt=false';
  request({
    url: url,
    json: true,
    headers: {
      'Access-Control-Allow-Origin': true
    }
  }, (error, response, body) => {
    if (error) {
      res.send(error);
    }
    if (response.body.includes('Exception:')) {
      res.send(response.body);
    } else {
      let parsedResponse = parser.toJson(body);
      let responseAsJs = JSON.parse(parsedResponse);
      res.send(responseAsJs.stopInfo);
    }
  })
}

var router = express.Router();

router.get('/', function(req, res) {
  res.send('im the home page!');
});

router.get('/train/station=:trainStation', function (req, res) {
  trainHttpRequest(req.params.trainStation, res);
});

router.get('/luas/station=:luasStop', function (req, res) {
  luasHttpRequest(req.params.luasStop, res);
});

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use('/api', router);

var port = process.env.PORT || 8080;

app.listen(port);