


function GAClassic () {
  this.name    = 'Google Analytics Classic';
  this.version = '5.2.5';
}


GAClassic.prototype._url = function () {
  return 'https://ssl.google-analytics.com/__utm.gif';
};


GAClassic.prototype.validate = function (message, settings) {

};


