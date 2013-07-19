Segment.io Integrations
-----------------------

Segment.io's support for server-side integrations. Turns fields from our [facade](https://github.com/segmentio/facade) into analytics data in the other services.

## Usage

```javascript
var integrations = require('segmentio-integrations')
  , facade       = require('segmentio-facade')
  , ga           = new integrations['Google Analytics']();

var track = new facade.Track({});

ga.track(track, settings, function (err) {
  if (!err) console.log('Google Analytics Track!');
  else console.error('An error occured!');
});
```

## Contributing

The best way to add a new server-side integrations is to add your own provider, and then pull request it into our library.

There are several pieces to this.

#### Adding the Integration

First off, you'll want to create your own folder under lib for your integration. You should use your integrations canonical name, lower-cased, and subsitute dashes ('-') for any non-letter characters.

Good examples of this are Keen IO, Customer.io, and Google Analytics.

The easiest way to start is to model the integration off existing integrations. You'll want to add the following methods, inherit from the Integration prototype, and set your integration's name.

* `.enabled()` - whether the integration should process this message
* `.validate()` - validate the integration's settings

In addition, depending on the type of integration, you will want to add methods to actually track user data.

* `.track()` - track user actions
* `.identify()` - tag users with specific data
* `.alias()` - alias one user id to another

It's worth checking out our [facade](https://github.com/segmentio/facade) objects to see what sort of fields are available to your provider. In general, you will want to use `.proxy()` to match keys fuzzily. If you see a field being used in multiple places, you can submit a request to add it to facade as well and give it a proper name.

If your integration doesn't use some of these methods, don't bother implementing them. Our service will not send them as a pass through.

In general, we prefer not to attach extra methods to the integration objects, unless they are specifically useful for testing. In that case, you can prefix those methods with an underscore, or separate them into a different module. We have kept them in a single module for ease of other developers.


#### Adding the Integration tests

In order to test your integration, you'll want to first add your proper credentials to a `test/auth.json` file, key'd with your integration's name. It might look something like this

```json
{
  "CrazyMetrics.io" : {
    "apiKey" : "some_rad_api_key"
  }
}
```

You can then mimic existing tests by making sure each of your methods passes successfully.

Once you're all set and ready to go, you'll want to first run ```npm install``` to install the necessary requirements.

Next, you'll want to add your settings to the `auth.json` file, and run mocha tests/test.crazymetrics-io.js.

