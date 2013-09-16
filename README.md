nox-camera-server
============

A hobby project to store and display pictures taken by security cameras at home. Built with <a href="https://github.com/asaarinen/nox.js">Nox.js</a>.

Currently being used with Axis 211 series cameras (see <a href="http://www.axis.com/products/cam_211/">here</a>), but should work with any IP cameras that can be configured to send images via HTTP POST.

Installation
--

Install by cloning this repository:

```
$ git clone https://github.com/asaarinen/nox-camera-server.git
```

Install dependencies:

```
$ npm install .
```

Start the server like this:

```
$ node server.js <your-ip> [<port>]
```

where `<your-ip>` is the IP where this server can be accessed. The IP is needed in order to send notification messages with correct URLs. `port` defaults to 8080.

The server will create `images` directory where all images are stored. The images older than 30 days are removed automatically.

Configuring Cameras
--

You will need to configure your cameras to send images via HTTP POST. The actual url needs to be:

```
http://<your-server-ip>[:<port>]/<camera-name>/timer/image<year>-<month>-<day>_ \
                                 <hour>-<minute>-<second>-<fraction>.jpg
```

where all `year`, `month`, etc. numbers need to have exactly 2 digits.

If your camera supports motion detection, you will need to configure it to send those images to a different url. This url is similar to the regular url above, except `timer` should be replaced with `motion`:

```
http://<your-server-ip>[:<port>]/<camera-name>/motion/image<year>-<month>-<day>_ \
                                 <hour>-<minute>-<second>-<fraction>.jpg
```

Configuring User Access
--

To secure the server, you need to give a username and password as environment variables. For example in Ubuntu Linux:

```
export cameraserverusername=<username>
export cameraserverpasswd=<password>
```

Configuring SMS notifications
--

If you want to use <a href="http://www.twilio.com">Twilio</a> SMS service for notifications, you will need to set it up via shell environment variables before starting the server. For example in Ubuntu Linux:

```
export twilioaccountsid=<your Twilio Account SID>
export twilioauthtoken=<your Twilio Auth Token>
export twiliofrom=<your Twilio phone number>
export twilioto=<your number where notification SMSes are sent>
```

The server will send SMSes at most once per hour.

3rd Party Software
--

This project uses the following 3rd party software, included in the `html/` directory:

- jQuery v1.10.2, Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors, see license <a href="http://jquery.org/license">here</a>
- Bootstrap v3.0, Copyright 2013 Twitter, Inc under the Apache 2.0 license, see license <a href="https://github.com/twbs/bootstrap/blob/master/LICENSE">here</a>
- respond.min.js, Copyright 2011: Scott Jehl, scottjehl.com, <a href="http://opensource.org/licenses/mit-license.php">MIT licensed</a>
- html5shiv, see <a href="https://code.google.com/p/html5shiv/">here</a>, <a href="http://opensource.org/licenses/mit-license.php">MIT licensed</a>

License
--

(The MIT License)

Copyright (c) 2013 Antti Saarinen &lt;antti.p.saarinen@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
