
1.1.24 / 2014-05-09
==================

 * frontleaf: adding frontleaft integration

1.1.23 / 2014-05-08
==================

 * kissmetrics: fix merge error

1.1.22 / 2014-05-08
==================

 * kissmetrics: add auto-alias

1.1.21 / 2014-05-06
==================

 * webhooks: adding transform for new spec
 * customerio: when the id is an email send it as .email too

1.1.20 / 2014-04-24
==================

 * hubspot: adding fix for "date" types + test cleanup
 * preact: added support for server-side Identify call, added source attribute to logged events and identify calls

1.1.19 / 2014-04-22
==================

 * intercom: only update impressions on .active()
 * add mixpanel increments, closes #78
 * update intercom events, closes #80

1.1.18 / 2014-04-17
==================

 * Fixing ga universal for ip and useragent

1.1.17 / 2014-04-15
==================

 * ga-universal: add .ip and .userAgent override
 * ga: move settings check to enabled
 * hubspot: replace spaces in properties with underscores

1.1.16 / 2014-04-09
==================

 * Amplitude segment.io integration.

1.1.15 / 2014-04-09
==================

 * fix for google analytics universal client id
 * add drip
 * vero: ignore idless requests

1.1.14 / 2014-04-04
==================

 * webhooks: bumping timeout
 * iterable: adding revenue

1.1.13 / 2014-04-01
==================

 * churnbee: should only be enabled for messages with .event()

1.1.12 / 2014-04-01
==================

 * bumping segmentio-integration for timeout fixes
 * vero: add .alias()
 * add churnbee

1.1.11 / 2014-03-24
==================

 * webhooks: lowering timeout and retries
 * updating gitignore

1.1.10 / 2014-03-20
==================

 * vero: enable only for messages with userId

1.1.9 / 2014-03-19
==================

 * customer.io: adding fix for dates + ocd

1.1.8 / 2014-03-17
==================

 * stacklead: adding stacklead integration

1.1.7 / 2014-03-17
==================

 * ga: fix typos

1.1.6 / 2014-03-14
==================

 * mixpanel: actually require errors

1.1.5 / 2014-03-13
==================

 * add jscoverage, closes #44
 * kissmetrics: send revenue as billing amount

1.1.4 / 2014-03-13
==================

 * intercom: fix for dates
 * adding fix for customer.io group

1.1.3 / 2014-03-13
==================

 * webhooks: fix to re-enable everywhere

1.1.2 / 2014-03-13
==================

 * customerio: fix created_at

1.1.1 / 2014-03-11
==================

 * keen: adding fix for bad responses

1.1.0 / 2014-03-10
==================

 * fix user-agent to match new facade
 * remove some deps
 * adding iterable integration ([hjz](https://github.com/hjz))

1.0.0 / 2014-03-06
==================

 * refactor to use new integration

0.1.28 / 2014-02-27
==================

 * commandiq: adding commandiq
 * intercom: add group()
 * ga: add page()
 * customer.io: add group()

0.1.27 / 2014-02-18
==================

 * mailchimp: fix for messages which have no email field

0.1.26 / 2014-02-17
==================

 * add intercom track

0.1.25 / 2014-02-11
==================

 * updating segmentio-facade as a dev-dep
 * intercom: dates fix
 * removing facade from deps
 * updating `isodate-traverse` #0.3.0

0.1.24 / 2014-02-11
==================

 * adding valid-querystring checks
 * revert `request-retry` upgrade

0.1.23 / 2014-02-10
==================

 * updating to request-retry 0.1.1
 * Merge pull request #30 from segmentio/mailchimp
 * adding support for traits to send as merge vars
 * adding mailchimp integration, fixes #29

0.1.22 / 2014-01-20
===================

  * intercom: fix for traits.companies when sent as a non-array

0.1.21 / 2014-01-15
===================

  * customer.io: adding last visit updates

0.1.20 / 2013-12-16
===================

  * helpscout: fixed tests (yields)
  * customer.io: removing sessionid (reinpk)
  * preact: relaxing `email` requirement to send data

0.1.19 / 2013-12-03
===================

  * hubspot: adding json-stringifying to object values
  * hubspot: fixing existing contacts race condition


0.1.18 / 2013-12-02
===================

  * mixpanel: updating track calls to include correct ip information
  * hubspot: adding fix for null values

0.1.17 / 2013-11-27
===================

  * webhooks: fixing test timeout
  * helpscout: fixing single `websites` value
  * hubspot: fixing boolean/string field errors

0.1.16 / 2013-11-18
===================

  * fix for hubspot dates, convert them to ms

0.1.15 / 2013-11-13
===================

  * adding trak.io integration ([scootklein](https://github.com/scootklein))
  * updating intercom to no longer use `custom_data` field
  * updating package.json to use newer facade


0.1.14 / 2013-10-31
===================

  * woopra: updating with /identify call (calvinfo)

0.1.13 / 2013-10-16
===================

  * google-analytics: renaming 'universal' -> 'serversideClassic' (calvinfo)

0.1.12 / 2013-10-16
===================

  * preact: added preact integration ([thefarside112](https://github.com/thefarside112))
  * debug: renaming debug everywhere (calvinfo)

0.1.11 / 2013-10-08
===================

  * mixpanel: adding detection for invalid dates (calvinfo)

0.1.10 / 2013-10-08
===================

  * mixpanel: adding version to $os and $browser (calvinfo)

0.1.9 / 2013-10-08
==================

  * mixpanel: add Mixpanel special property $username to identify ([brianpmarks](https://github.com/brianpmarks))

0.1.8 / 2013-10-08
==================

  * google-analytics: checking for value, removing default value

0.1.7 / 2013-10-06
==================

  * webhooks: adding timeout to request

0.1.6 / 2013-09-30
==================

  * librato: updating user-agent with segmentio version

0.1.5 / 2013-09-29
==================

  * webhooks: increasing retry count
  * usercycle: adding usercycle by [lfittl](https://github.com/lfittl)
  * google-analytics: removing default value as set to '1' by [mattsjohnston](https://github.com/mattsjohnston)


0.1.4 / 2013-09-19
==================

  * intercom: removing ip and useragent from user update
  * intercom: adding impressions for track and identify

0.1.3 / 2013-09-16
==================

  * Adding userId check to intercom enabled

0.1.2 / 2013-09-13
==================

  * Renaming HelpScout -> Help Scout
  * updating version of segmentio/new-date


0.1.1 / 2013-09-06
==================

  * Adding fix for HubSpot lowercased keys


0.1.0 / 2013-08-29
==================

  * Initial release
