import { Meteor } from 'meteor/meteor';
import ProxyLists from 'proxy-lists';

Meteor.startup(() => {
  var options = {
            protocols: ['http'],
            // protocols: ['http', 'https'],
            anonymityLevels: ['elite'],
            sourcesBlackList: ['bitproxies', 'kingproxies']
        };

        let func = (options, callback) => {
            // if proxy sources block you, set proxy for use proxy-lists like below:
            process.env.HTTP_PROXY = "http://127.0.0.1:8580";
            process.env.HTTPS_PROXY = "http://127.0.0.1:8580";

            let gettingProxies = ProxyLists.getProxies(options);
            // console.log(options);
            let proxyList = [];
            let success;
            let proxiesCount;
            gettingProxies.on('data', Meteor.bindEnvironment((proxies) => {
                console.log("Proxy Fetched: " + proxies.length);
                proxies.forEach((proxy) => {
                    proxyList.push(proxy.protocols[0] + "://" + proxy.ipAddress + ":" + proxy.port);
                });
            }));

            gettingProxies.on('error', Meteor.bindEnvironment((error) => {
                success = false;
                console.error("Error Occurred: " + error);
            }));

            gettingProxies.once('end', Meteor.bindEnvironment(() => {
                // unset proxy after fetch proxy finished
                delete process.env.HTTP_PROXY;
                delete process.env.HTTPS_PROXY;

                if (proxyList.length > 0) {
                    success = true;
                    proxiesCount = proxyList.length;

                    Proxies.remove({});
                    proxyList.forEach((proxy) => {
                        Proxies.insert({proxy: proxy});
                    });
                }
                callback(null, {success, proxiesCount});
            }));
        };

        let syncGetProxies = Meteor.wrapAsync(func);

        let getProxiesResult = syncGetProxies(options);

        if (getProxiesResult.success) {
            console.log("Total proxy count: " + getProxiesResult.proxiesCount);
        }
});
