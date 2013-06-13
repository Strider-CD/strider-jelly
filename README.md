# Strider-Jelly

A strider plugin to use the jelly-proxy to dynamically inject content into
proxied web content.

## Example:

Let's assume we want to run browser tests on a project. The project has
client side unit tests, however we want to use strider to manage the test
runs, so we need to get the results back from the browser.

We can do this as follows:

```
A cloud browser service (strider-sauce or strider-browserstack)
      ||
    requests localhost:$JELLYPORT/test
      ||
      \/
strider-jelly---------------
      ||                    /\
 proxied (inserts shim)     ||
 to $TESTPORT               ||
      ||            shim does custom reporting
      \/                    ||
your client side tests-------
```

