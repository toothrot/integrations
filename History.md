0.1.21 / 2014-01-15
====================

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