var dr=Object.defineProperty;var gr=(r,e,n)=>e in r?dr(r,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):r[e]=n;var K=(r,e,n)=>(gr(r,typeof e!="symbol"?e+"":e,n),n);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))t(s);new MutationObserver(s=>{for(const a of s)if(a.type==="childList")for(const i of a.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function n(s){const a={};return s.integrity&&(a.integrity=s.integrity),s.referrerPolicy&&(a.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?a.credentials="include":s.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function t(s){if(s.ep)return;s.ep=!0;const a=n(s);fetch(s.href,a)}})();const ie=[[4.2888,22.9514,40.2649,58.3664,74.5154,94.0865,115.9832,136.0011,163.4127,186.6976,207.6535,237.6242,264.8988,290.9424,314.6237,341.2594,374.2127,407.114,440.2038,466.8086,494.9784,524.412,549.3313,577.9856,596.2399,607.3775,625.0738,642.77,660.4663,678.1626,695.8588,713.5551,731.2514,748.9477,766.6439,784.3402,802.0365,819.7328,837.429,855.1253,877.9822,906.5289,937.2837,963.7545,990.7528,1016.4317,1034.128,1051.8243,1069.5206,1087.2168,1104.9131,1122.6094,1140.3057,1158.0019,1175.6982,1193.3945,1211.0907,1228.787,1246.4833,1264.1796,1281.8758,1299.5721,1317.2684,1334.9647,1352.6609,1363.7985,1384.4866,1401.9511,1422.7716,1439.9551,1465.6022,1494.4879,1528.991,1562.5759,1584.6081,1613.4801,1635.57,1653.2663,1670.9626,1688.6589,1706.3551,1726.3203,1758.7166,1789.5014,1806.166,1828.1849,1855.6605,1877.5872,1891.7013,1909.3976,1927.0939,1943.9704,1963.5169,1980.7738,2000.8055,2024.7369,2042.4332,2060.1294,2077.8257,2095.522,2114.319,2140.9869,2165.7129,2185.7291,2207.008,2232.0004,2259.6932,2289.5898,2309.6692,2326.8858,2343.3995,2361.0957,2378.792,2396.4883,2414.1846,2431.8808,2449.5771,2463.6061,2490.2068,2512.5056,2540.3123,2556.8538,2576.7439,2598.52,2612.601,2638.9076,2666.1492,2693.6033,2720.5802,2745.5274,2773.416,2794.1955,2819.1918,2847.9661,2875.3204,2900.2807,2932.2176,2951.2181],[4.2888,27.1995,44.3851,61.5706,72.5021,89.6132,107.8621,126.9038,144.4869,163.9647,186.3113,210.8133,233.7712,260.0785,290.7653,317.1741,339.1492,365.273,391.8674,424.7085,454.603,483.8951,509.7968,540.0255,569.3826,585.4356,602.6211,619.8067,636.9923,654.1778,671.3634,688.5489,705.7345,722.9201,740.1056,757.2912,774.4767,791.6623,808.8479,826.0334,845.4506,869.5375,896.2277,925.1234,954.4371,983.1067,996.9375,1014.123,1031.3086,1048.4942,1065.6797,1082.8653,1100.0508,1117.2364,1134.422,1151.6075,1168.7931,1185.9787,1203.1642,1220.3498,1237.5353,1254.7209,1271.9065,1289.092,1306.2776,1317.209,1332.3373,1348.9598,1365.2841,1380.5192,1403.4792,1426.6641,1456.9346,1490.846,1519.256,1547.8355,1563.9295,1581.1151,1598.3006,1615.4862,1632.6718,1658.1867,1690.6612,1727.3217,1750.055,1774.7557,1804.7092,1830.5159,1847.7015,1864.8871,1882.0726,1909.1899,1925.3942,1949.3082,1975.8943,1995.6081,2012.7937,2029.9792,2047.1648,2064.3503,2083.0278,2115.7475,2143.0031,2164.9205,2187.3464,2215.9211,2245.4086,2274.6898,2299.3134,2317.165,2328.0964,2345.282,2362.4676,2379.6531,2396.8387,2414.0243,2427.8688,2452.6033,2481.5437,2504.7565,2530.4057,2550.2436,2560.7623,2574.97,2598.3599,2622.7297,2649.1551,2676.8446,2702.3617,2731.2389,2765.1987,2792.8004,2816.9069,2842.1979,2872.1325,2902.3866,2929.0327,2951.3577],[4.2888,28.0428,46.0716,64.1004,82.1292,100.158,118.1868,136.2156,154.2444,172.2732,190.302,204.3605,221.953,240.097,261.7405,286.0191,310.8146,332.8455,363.8863,396.6013,422.4062,452.153,476.9008,501.1038,529.427,551.2206,569.2494,587.2782,605.307,623.3358,641.3646,659.3934,677.4222,695.451,713.4798,727.638,748.0723,775.951,792.8208,810.8496,834.4273,861.6297,886.2183,915.2006,940.0794,964.6657,981.1544,999.1832,1017.212,1035.2408,1053.2696,1071.2984,1089.3272,1107.356,1125.3848,1143.4136,1161.4424,1177.773,1199.3222,1224.5296,1249.0699,1271.8237,1296.8414,1324.212,1357.9806,1365.8451,1383.8739,1401.9027,1419.9315,1433.905,1463.7359,1487.4786,1514.0997,1544.656,1567.6921,1595.1355,1621.9709,1639.9997,1658.0285,1676.0573,1694.0861,1712.1149,1730.1438,1748.1726,1766.6777,1783.4141,1816.8891,1838.7763,1866.4702,1886.2876,1913.8208,1935.0836,1953.1124,1971.1412,1989.17,2007.1988,2033.1076,2057.5793,2087.8408,2104.4607,2122.4895,2140.5183,2158.5471,2176.5759,2200.0775,2224.6382,2250.2523,2279.2948,2297.1253,2317.9527,2331.9584,2349.9872,2368.016,2382.0387,2406.1715,2430.0466,2456.9513,2480.2436,2494.6518,2512.6806,2530.7094,2548.7382,2565.9914,2587.6284,2608.4742,2632.2515,2659.349,2688.1108,2708.3988,2734.3162,2766.1314,2789.9996,2816.5068,2845.8377,2871.4396,2898.4143,2924.8945,2951.1271],[5.5588,29.5785,47.873,66.1675,84.462,102.7565,121.051,139.3455,157.64,175.9345,194.229,212.5235,230.818,249.1125,267.407,285.7015,299.9542,317.6845,341.0178,362.9688,381.815,403.9461,424.3494,446.7551,474.4053,502.7978,532.1526,554.2573,565.6364,583.9309,602.2254,620.5199,638.8144,657.1089,675.4034,689.7497,708.8,734.4538,757.1405,775.435,798.799,823.9787,849.6067,878.4917,910.0929,934.5709,953.4743,971.7688,990.0633,1008.3578,1026.6523,1044.9468,1063.2413,1081.5358,1099.8303,1118.1248,1132.3032,1150.2273,1173.3462,1200.8064,1228.6017,1256.1983,1279.7608,1311.4469,1349.3481,1374.3981,1392.6926,1410.9871,1429.2816,1443.87,1467.4037,1499.1215,1530.1262,1561.5383,1590.8146,1619.4373,1636.1212,1654.4157,1672.7102,1691.0047,1709.2992,1727.5937,1745.8882,1764.1827,1786.9434,1801.4679,1830.3287,1851.6595,1869.131,1886.1952,1903.6291,1920.6654,1938.9599,1957.2544,1975.5489,1993.8434,2011.4643,2033.9798,2062.3475,2076.9045,2095.199,2113.4935,2131.788,2150.0825,2179.3738,2206.0215,2232.3798,2259.778,2280.0219,2304.657,2316.036,2334.3305,2352.625,2370.9195,2391.1399,2420.6948,2451.0698,2472.5828,2489.7597,2508.0542,2526.3487,2544.6432,2555.5988,2578.2156,2604.5963,2628.6329,2653.9388,2681.4879,2706.9076,2734.2057,2762.9283,2792.3107,2822.611,2847.7301,2876.6984,2903.7287,2933.5155,2951.0545],[4.2888,28.596,47.1781,65.7602,84.3423,102.9244,121.5064,140.0885,158.6706,177.2527,195.8348,214.4169,232.999,251.581,270.1631,288.7452,307.3273,325.9094,344.4915,363.0735,381.6556,400.2377,418.8198,436.8101,454.5611,473.7979,497.029,518.8599,546.5898,571.3767,598.4486,621.5635,644.1365,666.1308,689.6513,703.887,722.469,741.0511,759.6332,778.2153,802.0382,824.608,853.2548,882.8011,909.6314,935.6007,952.8368,971.4189,990.001,1008.5831,1026.9548,1049.8791,1077.951,1097.0077,1121.474,1145.4938,1177.4484,1206.3066,1230.7567,1252.9651,1267.5626,1286.1447,1304.7268,1323.3088,1341.8909,1360.473,1379.0551,1397.6372,1416.2193,1438.0338,1463.9371,1491.1261,1520.2724,1553.647,1583.4894,1614.3372,1640.334,1654.7336,1679.5038,1703.2841,1733.0218,1752.9885,1771.5706,1790.1527,1808.7348,1825.4075,1851.3182,1884.5356,1902.313,1920.8951,1939.4772,1958.0593,1976.6414,1995.2234,2013.8055,2028.3568,2046.3023,2071.2737,2095.7303,2115.1582,2141.406,2164.4696,2183.0517,2201.6338,2220.2159,2238.798,2257.3801,2275.9621,2290.3942,2310.4982,2333.5401,2352.8027,2376.8947,2395.9803,2410.9197,2429.5018,2448.0839,2466.666,2485.248,2503.8301,2522.4122,2540.9943,2566.2677,2596.5868,2613.486,2636.7911,2663.7407,2689.7711,2719.6218,2745.4654,2772.2802,2803.6363,2829.0013,2858.8954,2887.8446,2915.8535,2942.9601,2950.9758],[4.2888,28.0117,46.0094,64.0071,82.0048,100.0026,118.0003,135.998,153.9957,171.9934,189.9912,207.9889,225.9866,243.9843,261.9821,279.9798,297.9775,315.9752,333.973,351.9707,369.9684,387.9661,405.9638,423.9616,438.0395,455.8347,474.4856,498.6507,523.1827,549.8937,578.2357,602.704,630.9063,656.6943,686.93,703.6521,721.6498,739.6475,757.6452,775.643,797.1639,825.5054,853.6019,883.2131,913.4574,934.0209,948.275,966.2727,980.2792,997.8573,1015.823,1039.4609,1066.8649,1093.6249,1117.5744,1150.7847,1178.166,1192.423,1210.4207,1228.4184,1246.4162,1264.4139,1282.4116,1300.4093,1318.407,1336.4048,1354.4025,1372.4002,1390.3979,1412.9531,1435.1232,1465.7714,1498.1948,1531.037,1558.574,1590.9624,1621.9003,1636.014,1662.7961,1690.9494,1722.4098,1740.529,1758.5267,1776.5245,1794.5222,1811.1051,1837.3889,1861.1848,1875.3992,1893.3969,1911.3946,1929.3923,1947.39,1965.3878,1983.3855,1999.9447,2026.2842,2054.0945,2076.2738,2097.9735,2127.131,2149.4168,2167.4145,2185.4122,2203.4099,2221.4076,2239.4054,2257.4031,2271.6731,2290.3276,2310.3864,2331.9217,2351.7108,2378.0985,2408.2952,2424.9223,2442.92,2460.9178,2478.9155,2496.9132,2514.9109,2532.9087,2552.9984,2578.5182,2604.3169,2630.8718,2659.2966,2687.1062,2711.9854,2738.9098,2764.112,2792.8981,2823.3968,2845.0824,2873.9899,2900.6364,2925.4939,2945.0053,2952.8613],[4.2888,29.7538,49.4937,69.2336,88.9735,108.7134,128.4533,148.1931,167.933,187.6729,207.4128,227.1527,246.8926,266.6325,286.3723,306.1122,325.8521,345.592,365.3319,385.0718,404.8117,424.5515,444.2914,464.0313,483.7712,503.5111,523.251,542.9909,561.675,584.8169,605.8834,629.5106,651.345,682.2713,709.0931,736.9261,755.0842,770.1052,791.5224,816.1588,844.1674,874.152,898.0033,931.324,956.6776,981.3183,1009.5866,1029.6325,1054.1864,1073.9385,1099.7744,1123.918,1146.7571,1173.3626,1201.8303,1230.4489,1254.5711,1262.5611,1270.5511,1278.5411,1286.5311,1294.5211,1302.5111,1310.5011,1318.4911,1326.4811,1334.4711,1342.4611,1350.4511,1365.4115,1392.9121,1423.4378,1453.0408,1484.4412,1514.9201,1545.6957,1575.165,1603.2478,1620.9019,1640.6418,1660.3817,1680.1215,1699.8614,1719.6013,1739.3412,1759.0811,1782.7102,1806.2692,1823.6805,1853.386,1870.9015,1890.6414,1920.275,1947.6534,1971.3569,1996.0668,2015.8067,2035.5466,2055.2865,2086.4112,2106.1511,2125.891,2146.7298,2173.1777,2191.1743,2210.9142,2230.6541,2250.394,2265.5036,2281.1051,2293.0676,2312.8075,2332.5474,2352.2873,2372.0271,2391.767,2411.5069,2431.2468,2450.9867,2470.7266,2490.4665,2510.2063,2521.6042,2548.5947,2569.5476,2593.6403,2624.3103,2654.4393,2685.1355,2716.8455,2751.0733,2780.1363,2803.9793,2830.5053,2862.1423,2888.3878,2918.6871,2944.166,2952.4984],[4.2888,28.9167,47.8194,66.7222,85.6249,104.5277,123.4304,142.3332,161.2359,180.1386,199.0414,217.9441,236.8469,255.7496,274.6524,293.5551,312.4579,331.3606,350.2633,369.1661,388.0688,406.9716,425.8743,444.7771,463.6798,482.5826,501.4853,520.388,539.2908,558.1935,577.0963,595.999,614.9018,633.0399,650.8995,677.8706,702.5163,717.0564,736.712,759.771,784.5518,809.315,832.6505,857.9746,885.8318,903.8528,921.9519,942.4557,966.7583,994.5413,1025.2927,1052.7922,1078.6772,1093.4143,1112.3171,1131.2198,1150.1226,1169.0253,1187.928,1206.8308,1225.7335,1244.6363,1263.539,1282.4418,1301.3445,1320.2473,1339.15,1358.0527,1376.9555,1391.7994,1417.3258,1443.6162,1475.6697,1508.2417,1538.1548,1569.7078,1599.5837,1628.5784,1640.203,1659.1057,1678.0085,1696.9112,1715.814,1734.7167,1753.6195,1772.5222,1798.5879,1830.5672,1849.4699,1867.2236,1881.8007,1900.7035,1918.5371,1939.4343,1962.8807,1994.1305,2013.0333,2031.936,2050.8388,2074.6789,2093.5816,2112.4844,2137.4381,2164.0999,2183.6836,2202.5863,2221.4891,2240.3918,2255.0549,2282.0041,2306.0004,2324.9031,2343.8059,2362.7086,2381.6113,2400.5141,2419.4168,2438.3196,2457.2223,2476.1251,2495.0278,2513.9306,2525.0469,2545.467,2566.525,2588.6446,2614.62,2643.0846,2672.5252,2705.7243,2737.6044,2766.9548,2797.5047,2827.9612,2857.4097,2887.5339,2917.2943,2944.5693,2952.6728]];function T(r){const e=r||"";return function(){throw new Error("this method "+e+" is abstract! (it has no implementation in class "+this.constructor.name+")")}}function Z(r,e){if(!r)throw new Error(e||"Assertion failed")}function Ee(r,e,n){let t;Object.defineProperty(r,e,{get(){return t||(t=n.call(this)),t}})}function lr(r){return r&&Object.assign({},r)}function Pn(r,e){const n=[];for(;e-- >0;)n.push(r());return n}function En(r,e){return new Array(e+1).join(r)}function we(r,e){return Pn(()=>r,e)}function Fe(r){const e=[];for(let n=0;n<r.length;n++){const t=r[n];r.lastIndexOf(t)!==n&&e.indexOf(t)<0&&e.push(t)}return e}function Fn(r){const e=[];return r.forEach(n=>{e.indexOf(n)<0&&e.push(n)}),e}function ne(r){const e=r[0];return e===e.toUpperCase()}function kn(r){return!ne(r)}function Tn(r,e,n){const t=n||" ";return r.length<e?En(t,e-r.length)+r:r}function te(){this.strings=[]}te.prototype.append=function(r){this.strings.push(r)};te.prototype.contents=function(){return this.strings.join("")};const Ne=r=>String.fromCodePoint(parseInt(r,16));function Dn(r){if(r.charAt(0)==="\\")switch(r.charAt(1)){case"b":return"\b";case"f":return"\f";case"n":return`
`;case"r":return"\r";case"t":return"	";case"v":return"\v";case"x":return Ne(r.slice(2,4));case"u":return r.charAt(2)==="{"?Ne(r.slice(3,-1)):Ne(r.slice(2,6));default:return r.charAt(1)}else return r}function Bn(r){if(r==null)return String(r);const e=Object.prototype.toString.call(r);try{let n;return r.constructor&&r.constructor.name?n=r.constructor.name:e.indexOf("[object ")===0?n=e.slice(8,-1):n=typeof r,n+": "+JSON.stringify(String(r))}catch{return e}}const ur=Object.freeze(Object.defineProperty({__proto__:null,StringBuffer:te,abstract:T,assert:Z,clone:lr,copyWithoutDuplicates:Fn,defineLazyProperty:Ee,getDuplicates:Fe,isLexical:kn,isSyntactic:ne,padLeft:Tn,repeat:we,repeatFn:Pn,repeatStr:En,unescapeCodePoint:Dn,unexpectedObjToString:Bn},Symbol.toStringTag,{value:"Module"})),pr={Lu:new RegExp("\\p{Lu}","u"),Ll:new RegExp("\\p{Ll}","u"),Lt:new RegExp("\\p{Lt}","u"),Lm:new RegExp("\\p{Lm}","u"),Lo:new RegExp("\\p{Lo}","u"),Nl:new RegExp("\\p{Nl}","u"),Nd:new RegExp("\\p{Nd}","u"),Mn:new RegExp("\\p{Mn}","u"),Mc:new RegExp("\\p{Mc}","u"),Pc:new RegExp("\\p{Pc}","u"),Zs:new RegExp("\\p{Zs}","u"),L:new RegExp("\\p{Letter}","u"),Ltmo:new RegExp("\\p{Lt}|\\p{Lm}|\\p{Lo}","u")};class f{constructor(){if(this.constructor===f)throw new Error("PExpr cannot be instantiated -- it's abstract")}withSource(e){return e&&(this.source=e.trimmed()),this}}const C=Object.create(f.prototype),P=Object.create(f.prototype);class N extends f{constructor(e){super(),this.obj=e}}class E extends f{constructor(e,n){super(),this.from=e,this.to=n,this.matchCodePoint=e.length>1||n.length>1}}class F extends f{constructor(e){super(),this.index=e}}class S extends f{constructor(e){super(),this.terms=e}}class Ae extends S{constructor(e,n,t){const s=e.rules[n].body;super([t,s]),this.superGrammar=e,this.name=n,this.body=t}}class _e extends S{constructor(e,n,t,s){const a=e.rules[n].body;super([...t,a,...s]),this.superGrammar=e,this.ruleName=n,this.expansionPos=t.length}}class w extends f{constructor(e){super(),this.factors=e}}class D extends f{constructor(e){super(),this.expr=e}}class se extends D{}class oe extends D{}class Y extends D{}se.prototype.operator="*";oe.prototype.operator="+";Y.prototype.operator="?";se.prototype.minNumMatches=0;oe.prototype.minNumMatches=1;Y.prototype.minNumMatches=0;se.prototype.maxNumMatches=Number.POSITIVE_INFINITY;oe.prototype.maxNumMatches=Number.POSITIVE_INFINITY;Y.prototype.maxNumMatches=1;class B extends f{constructor(e){super(),this.expr=e}}class M extends f{constructor(e){super(),this.expr=e}}class G extends f{constructor(e){super(),this.expr=e}}class b extends f{constructor(e,n=[]){super(),this.ruleName=e,this.args=n}isSyntactic(){return ne(this.ruleName)}toMemoKey(){return this._memoKey||Object.defineProperty(this,"_memoKey",{value:this.toString()}),this._memoKey}}class L extends f{constructor(e){super(),this.category=e,this.pattern=pr[e]}}function R(r,e){let n;return e?(n=new Error(e.getLineAndColumnMessage()+r),n.shortMessage=r,n.interval=e):n=new Error(r),n}function ke(){return R("Interval sources don't match")}function fr(r){const e=new Error;return Object.defineProperty(e,"message",{enumerable:!0,get(){return r.message}}),Object.defineProperty(e,"shortMessage",{enumerable:!0,get(){return"Expected "+r.getExpectedText()}}),e.interval=r.getInterval(),e}function hr(r,e,n){const t=e?`Grammar ${r} is not declared in namespace '${e}'`:"Undeclared grammar "+r;return R(t,n)}function br(r,e){return R("Grammar "+r.name+" is already declared in this namespace")}function mr(r){return R(`Grammar '${r.name}' does not support incremental parsing`)}function Mn(r,e,n){return R("Rule "+r+" is not declared in grammar "+e,n)}function vr(r,e,n){return R("Cannot override rule "+r+" because it is not declared in "+e,n)}function Ir(r,e,n){return R("Cannot extend rule "+r+" because it is not declared in "+e,n)}function on(r,e,n,t){let s="Duplicate declaration for rule '"+r+"' in grammar '"+e+"'";return e!==n&&(s+=" (originally declared in '"+n+"')"),R(s,t)}function jn(r,e,n,t){return R("Wrong number of parameters for rule "+r+" (expected "+e+", got "+n+")",t)}function yr(r,e,n,t){return R("Wrong number of arguments for rule "+r+" (expected "+e+", got "+n+")",t)}function dn(r,e,n){return R("Duplicate parameter names in rule "+r+": "+e.join(", "),n)}function Rr(r,e){return R("Invalid parameter to rule "+r+": "+e+" has arity "+e.getArity()+", but parameter expressions must have arity 1",e.source)}const xr="NOTE: A _syntactic rule_ is a rule whose name begins with a capital letter. See https://ohmjs.org/d/svl for more details.";function Sr(r,e){return R("Cannot apply syntactic rule "+r+" from here (inside a lexical context)",e.source)}function wr(r){const{ruleName:e}=r;return R(`applySyntactic is for syntactic rules, but '${e}' is a lexical rule. `+xr,r.source)}function Ar(r){return R("applySyntactic is not required here (in a syntactic context)",r.source)}function gn(r,e){return R("Incorrect argument type: expected "+r,e.source)}function _r(r){return R("'...' can appear at most once in a rule body",r.source)}function Lr(r){const e=r._node;Z(e&&e.isNonterminal()&&e.ctorName==="escapeChar_unicodeCodePoint");const n=r.children.slice(1,-1).map(s=>s.source),t=n[0].coverageWith(...n.slice(1));return R(`U+${t.contents} is not a valid Unicode code point`,t)}function Gn(r,e){const n=e.length>0?e[e.length-1].args:[];let s="Nullable expression "+r.expr.substituteParams(n)+" is not allowed inside '"+r.operator+"' (possible infinite loop)";if(e.length>0){const a=e.map(i=>new b(i.ruleName,i.args)).join(`
`);s+=`
Application stack (most recent application last):
`+a}return R(s,r.expr.source)}function Vn(r,e,n,t){return R("Rule "+r+" involves an alternation which has inconsistent arity (expected "+e+", got "+n+")",t.source)}function Nr(r){const e=r.map(n=>n.message);return R(["Errors:"].concat(e).join(`
- `),r[0].interval)}function Or(r,e,n,t){let s=t.slice(0,-1).map(o=>{const l="  "+o[0].name+" > "+o[1];return o.length===3?l+" for '"+o[2]+"'":l}).join(`
`);s+=`
  `+e+" > "+r;let a="";r==="_iter"&&(a=[`
NOTE: as of Ohm v16, there is no default action for iteration nodes — see `,"  https://ohmjs.org/d/dsa for details."].join(`
`));const i=[`Missing semantic action for '${r}' in ${n} '${e}'.${a}`,"Action stack (most recent call last):",s].join(`
`),g=R(i);return g.name="missingSemanticAction",g}function Cr(r){if(r.length===1)throw r[0];if(r.length>1)throw Nr(r)}function Pr(r){let e=0;return r.map(t=>{const s=t.toString();return e=Math.max(e,s.length),s}).map(t=>Tn(t,e))}function ln(r,e,n){const t=r.length,s=r.slice(0,n),a=r.slice(n+e.length);return(s+e+a).substr(0,t)}function Er(...r){const e=this,{offset:n}=e,{repeatStr:t}=ur,s=new te;s.append("Line "+e.lineNum+", col "+e.colNum+`:
`);const a=Pr([e.prevLine==null?0:e.lineNum-1,e.lineNum,e.nextLine==null?0:e.lineNum+1]),i=(c,d,u)=>{s.append(u+a[c]+" | "+d+`
`)};e.prevLine!=null&&i(0,e.prevLine,"  "),i(1,e.line,"> ");const g=e.line.length;let o=t(" ",g+1);for(let c=0;c<r.length;++c){let d=r[c][0],u=r[c][1];Z(d>=0&&d<=u,"range start must be >= 0 and <= end");const p=n-e.colNum+1;d=Math.max(0,d-p),u=Math.min(u-p,g),o=ln(o,t("~",u-d),d)}const l=2+a[1].length+3;return s.append(t(" ",l)),o=ln(o,"^",e.colNum-1),s.append(o.replace(/ +$/,"")+`
`),e.nextLine!=null&&i(2,e.nextLine,"  "),s.contents()}let Te=[];function qn(r){Te.push(r)}function Fr(r){Te.forEach(e=>{e(r)}),Te=null}function $e(r,e){let n=1,t=1,s=0,a=0,i=null,g=null,o=-1;for(;s<e;){const d=r.charAt(s++);d===`
`?(n++,t=1,o=a,a=s):d!=="\r"&&t++}let l=r.indexOf(`
`,a);if(l===-1)l=r.length;else{const d=r.indexOf(`
`,l+1);i=d===-1?r.slice(l):r.slice(l,d),i=i.replace(/^\r?\n/,"").replace(/\r$/,"")}o>=0&&(g=r.slice(o,a).replace(/\r?\n$/,""));const c=r.slice(a,l).replace(/\r$/,"");return{offset:e,lineNum:n,colNum:t,line:c,prevLine:g,nextLine:i,toString:Er}}function ze(r,e,...n){return $e(r,e).toString(...n)}const un=(()=>{let r=0;return e=>""+e+r++})();class O{constructor(e,n,t){this.sourceString=e,this.startIdx=n,this.endIdx=t}get contents(){return this._contents===void 0&&(this._contents=this.sourceString.slice(this.startIdx,this.endIdx)),this._contents}get length(){return this.endIdx-this.startIdx}coverageWith(...e){return O.coverage(...e,this)}collapsedLeft(){return new O(this.sourceString,this.startIdx,this.startIdx)}collapsedRight(){return new O(this.sourceString,this.endIdx,this.endIdx)}getLineAndColumn(){return $e(this.sourceString,this.startIdx)}getLineAndColumnMessage(){const e=[this.startIdx,this.endIdx];return ze(this.sourceString,this.startIdx,e)}minus(e){if(this.sourceString!==e.sourceString)throw ke();return this.startIdx===e.startIdx&&this.endIdx===e.endIdx?[]:this.startIdx<e.startIdx&&e.endIdx<this.endIdx?[new O(this.sourceString,this.startIdx,e.startIdx),new O(this.sourceString,e.endIdx,this.endIdx)]:this.startIdx<e.endIdx&&e.endIdx<this.endIdx?[new O(this.sourceString,e.endIdx,this.endIdx)]:this.startIdx<e.startIdx&&e.startIdx<this.endIdx?[new O(this.sourceString,this.startIdx,e.startIdx)]:[this]}relativeTo(e){if(this.sourceString!==e.sourceString)throw ke();return Z(this.startIdx>=e.startIdx&&this.endIdx<=e.endIdx,"other interval does not cover this one"),new O(this.sourceString,this.startIdx-e.startIdx,this.endIdx-e.startIdx)}trimmed(){const{contents:e}=this,n=this.startIdx+e.match(/^\s*/)[0].length,t=this.endIdx-e.match(/\s*$/)[0].length;return new O(this.sourceString,n,t)}subInterval(e,n){const t=this.startIdx+e;return new O(this.sourceString,t,t+n)}}O.coverage=function(r,...e){let{startIdx:n,endIdx:t}=r;for(const s of e){if(s.sourceString!==r.sourceString)throw ke();n=Math.min(n,s.startIdx),t=Math.max(t,s.endIdx)}return new O(r.sourceString,n,t)};const kr=65535;class Le{constructor(e){this.source=e,this.pos=0,this.examinedLength=0}atEnd(){const e=this.pos>=this.source.length;return this.examinedLength=Math.max(this.examinedLength,this.pos+1),e}next(){const e=this.source[this.pos++];return this.examinedLength=Math.max(this.examinedLength,this.pos),e}nextCharCode(){const e=this.next();return e&&e.charCodeAt(0)}nextCodePoint(){const e=this.source.slice(this.pos++).codePointAt(0);return e>kr&&(this.pos+=1),this.examinedLength=Math.max(this.examinedLength,this.pos),e}matchString(e,n){let t;if(n){for(t=0;t<e.length;t++){const s=this.next(),a=e[t];if(s==null||s.toUpperCase()!==a.toUpperCase())return!1}return!0}for(t=0;t<e.length;t++)if(this.next()!==e[t])return!1;return!0}sourceSlice(e,n){return this.source.slice(e,n)}interval(e,n){return new O(this.source,e,n||this.pos)}}class Hn{constructor(e,n,t,s,a,i,g){this.matcher=e,this.input=n,this.startExpr=t,this._cst=s,this._cstOffset=a,this._rightmostFailurePosition=i,this._rightmostFailures=g,this.failed()&&(Ee(this,"message",function(){const o="Expected "+this.getExpectedText();return ze(this.input,this.getRightmostFailurePosition())+o}),Ee(this,"shortMessage",function(){const o="expected "+this.getExpectedText(),l=$e(this.input,this.getRightmostFailurePosition());return"Line "+l.lineNum+", col "+l.colNum+": "+o}))}succeeded(){return!!this._cst}failed(){return!this.succeeded()}getRightmostFailurePosition(){return this._rightmostFailurePosition}getRightmostFailures(){if(!this._rightmostFailures){this.matcher.setInput(this.input);const e=this.matcher._match(this.startExpr,{tracing:!1,positionToRecordFailures:this.getRightmostFailurePosition()});this._rightmostFailures=e.getRightmostFailures()}return this._rightmostFailures}toString(){return this.succeeded()?"[match succeeded]":"[match failed at position "+this.getRightmostFailurePosition()+"]"}getExpectedText(){if(this.succeeded())throw new Error("cannot get expected text of a successful MatchResult");const e=new te;let n=this.getRightmostFailures();n=n.filter(t=>!t.isFluffy());for(let t=0;t<n.length;t++)t>0&&(t===n.length-1?e.append(n.length>2?", or ":" or "):e.append(", ")),e.append(n[t].toString());return e.contents()}getInterval(){const e=this.getRightmostFailurePosition();return new O(this.input,e,e)}}class Tr{constructor(){this.applicationMemoKeyStack=[],this.memo={},this.maxExaminedLength=0,this.maxRightmostFailureOffset=-1,this.currentLeftRecursion=void 0}isActive(e){return this.applicationMemoKeyStack.indexOf(e.toMemoKey())>=0}enter(e){this.applicationMemoKeyStack.push(e.toMemoKey())}exit(){this.applicationMemoKeyStack.pop()}startLeftRecursion(e,n){n.isLeftRecursion=!0,n.headApplication=e,n.nextLeftRecursion=this.currentLeftRecursion,this.currentLeftRecursion=n;const{applicationMemoKeyStack:t}=this,s=t.indexOf(e.toMemoKey())+1,a=t.slice(s);n.isInvolved=function(i){return a.indexOf(i)>=0},n.updateInvolvedApplicationMemoKeys=function(){for(let i=s;i<t.length;i++){const g=t[i];this.isInvolved(g)||a.push(g)}}}endLeftRecursion(){this.currentLeftRecursion=this.currentLeftRecursion.nextLeftRecursion}shouldUseMemoizedResult(e){if(!e.isLeftRecursion)return!0;const{applicationMemoKeyStack:n}=this;for(let t=0;t<n.length;t++){const s=n[t];if(e.isInvolved(s))return!1}return!0}memoize(e,n){return this.memo[e]=n,this.maxExaminedLength=Math.max(this.maxExaminedLength,n.examinedLength),this.maxRightmostFailureOffset=Math.max(this.maxRightmostFailureOffset,n.rightmostFailureOffset),n}clearObsoleteEntries(e,n){if(e+this.maxExaminedLength<=n)return;const{memo:t}=this;this.maxExaminedLength=0,this.maxRightmostFailureOffset=-1,Object.keys(t).forEach(s=>{const a=t[s];e+a.examinedLength>n?delete t[s]:(this.maxExaminedLength=Math.max(this.maxExaminedLength,a.examinedLength),this.maxRightmostFailureOffset=Math.max(this.maxRightmostFailureOffset,a.rightmostFailureOffset))})}}const Dr="✗",Br="✓",Mr="⋅",jr="⇒",Gr="␉",Vr="␊",qr="␍",De={succeeded:1,isRootNode:2,isImplicitSpaces:4,isMemoized:8,isHeadOfLeftRecursion:16,terminatesLR:32};function Hr(r){return we(" ",r).join("")}function Kr(r,e,n){const t=Kn(r.slice(e,e+n));return t.length<n?t+we(" ",n-t.length).join(""):t}function Kn(r){return typeof r=="string"?r.replace(/ /g,Mr).replace(/\t/g,Gr).replace(/\n/g,Vr).replace(/\r/g,qr):String(r)}class X{constructor(e,n,t,s,a,i,g){this.input=e,this.pos=this.pos1=n,this.pos2=t,this.source=new O(e,n,t),this.expr=s,this.bindings=i,this.children=g||[],this.terminatingLREntry=null,this._flags=a?De.succeeded:0}get displayString(){return this.expr.toDisplayString()}clone(){return this.cloneWithExpr(this.expr)}cloneWithExpr(e){const n=new X(this.input,this.pos,this.pos2,e,this.succeeded,this.bindings,this.children);return n.isHeadOfLeftRecursion=this.isHeadOfLeftRecursion,n.isImplicitSpaces=this.isImplicitSpaces,n.isMemoized=this.isMemoized,n.isRootNode=this.isRootNode,n.terminatesLR=this.terminatesLR,n.terminatingLREntry=this.terminatingLREntry,n}recordLRTermination(e,n){this.terminatingLREntry=new X(this.input,this.pos,this.pos2,this.expr,!1,[n],[e]),this.terminatingLREntry.terminatesLR=!0}walk(e,n){let t=e;typeof t=="function"&&(t={enter:t});function s(a,i,g){let o=!0;t.enter&&t.enter.call(n,a,i,g)===X.prototype.SKIP&&(o=!1),o&&(a.children.forEach(l=>{s(l,a,g+1)}),t.exit&&t.exit.call(n,a,i,g))}this.isRootNode?this.children.forEach(a=>{s(a,null,0)}):s(this,null,0)}toString(){const e=new te;return this.walk((n,t,s)=>{if(!n)return this.SKIP;if(n.expr.constructor.name!=="Alt"){if(e.append(Kr(n.input,n.pos,10)+Hr(s*2+1)),e.append((n.succeeded?Br:Dr)+" "+n.displayString),n.isHeadOfLeftRecursion&&e.append(" (LR)"),n.succeeded){const i=Kn(n.source.contents);e.append(" "+jr+"  "),e.append(typeof i=="string"?'"'+i+'"':i)}e.append(`
`)}}),e.contents()}}X.prototype.SKIP={};Object.keys(De).forEach(r=>{const e=De[r];Object.defineProperty(X.prototype,r,{get(){return(this._flags&e)!==0},set(n){n?this._flags|=e:this._flags&=~e}})});f.prototype.allowsSkippingPrecedingSpace=T("allowsSkippingPrecedingSpace");C.allowsSkippingPrecedingSpace=P.allowsSkippingPrecedingSpace=b.prototype.allowsSkippingPrecedingSpace=N.prototype.allowsSkippingPrecedingSpace=E.prototype.allowsSkippingPrecedingSpace=L.prototype.allowsSkippingPrecedingSpace=function(){return!0};S.prototype.allowsSkippingPrecedingSpace=D.prototype.allowsSkippingPrecedingSpace=G.prototype.allowsSkippingPrecedingSpace=M.prototype.allowsSkippingPrecedingSpace=B.prototype.allowsSkippingPrecedingSpace=F.prototype.allowsSkippingPrecedingSpace=w.prototype.allowsSkippingPrecedingSpace=function(){return!1};let ge;qn(r=>{ge=r});let Re;f.prototype.assertAllApplicationsAreValid=function(r,e){Re=0,this._assertAllApplicationsAreValid(r,e)};f.prototype._assertAllApplicationsAreValid=T("_assertAllApplicationsAreValid");C._assertAllApplicationsAreValid=P._assertAllApplicationsAreValid=N.prototype._assertAllApplicationsAreValid=E.prototype._assertAllApplicationsAreValid=F.prototype._assertAllApplicationsAreValid=L.prototype._assertAllApplicationsAreValid=function(r,e){};G.prototype._assertAllApplicationsAreValid=function(r,e){Re++,this.expr._assertAllApplicationsAreValid(r,e),Re--};S.prototype._assertAllApplicationsAreValid=function(r,e){for(let n=0;n<this.terms.length;n++)this.terms[n]._assertAllApplicationsAreValid(r,e)};w.prototype._assertAllApplicationsAreValid=function(r,e){for(let n=0;n<this.factors.length;n++)this.factors[n]._assertAllApplicationsAreValid(r,e)};D.prototype._assertAllApplicationsAreValid=B.prototype._assertAllApplicationsAreValid=M.prototype._assertAllApplicationsAreValid=function(r,e){this.expr._assertAllApplicationsAreValid(r,e)};b.prototype._assertAllApplicationsAreValid=function(r,e,n=!1){const t=e.rules[this.ruleName],s=ne(r)&&Re===0;if(!t)throw Mn(this.ruleName,e.name,this.source);if(!n&&ne(this.ruleName)&&!s)throw Sr(this.ruleName,this);const a=this.args.length,i=t.formals.length;if(a!==i)throw yr(this.ruleName,i,a,this.source);const g=ge&&t===ge.rules.applySyntactic;if(ge&&t===ge.rules.caseInsensitive&&!(this.args[0]instanceof N))throw gn('a Terminal (e.g. "abc")',this.args[0]);if(g){const l=this.args[0];if(!(l instanceof b))throw gn("a syntactic rule application",l);if(!ne(l.ruleName))throw wr(l);if(s)throw Ar(this)}this.args.forEach(l=>{if(l._assertAllApplicationsAreValid(r,e,g),l.getArity()!==1)throw Rr(this.ruleName,l)})};f.prototype.assertChoicesHaveUniformArity=T("assertChoicesHaveUniformArity");C.assertChoicesHaveUniformArity=P.assertChoicesHaveUniformArity=N.prototype.assertChoicesHaveUniformArity=E.prototype.assertChoicesHaveUniformArity=F.prototype.assertChoicesHaveUniformArity=G.prototype.assertChoicesHaveUniformArity=L.prototype.assertChoicesHaveUniformArity=function(r){};S.prototype.assertChoicesHaveUniformArity=function(r){if(this.terms.length===0)return;const e=this.terms[0].getArity();for(let n=0;n<this.terms.length;n++){const t=this.terms[n];t.assertChoicesHaveUniformArity();const s=t.getArity();if(e!==s)throw Vn(r,e,s,t)}};Ae.prototype.assertChoicesHaveUniformArity=function(r){const e=this.terms[0].getArity(),n=this.terms[1].getArity();if(e!==n)throw Vn(r,n,e,this.terms[0])};w.prototype.assertChoicesHaveUniformArity=function(r){for(let e=0;e<this.factors.length;e++)this.factors[e].assertChoicesHaveUniformArity(r)};D.prototype.assertChoicesHaveUniformArity=function(r){this.expr.assertChoicesHaveUniformArity(r)};B.prototype.assertChoicesHaveUniformArity=function(r){};M.prototype.assertChoicesHaveUniformArity=function(r){this.expr.assertChoicesHaveUniformArity(r)};b.prototype.assertChoicesHaveUniformArity=function(r){};f.prototype.assertIteratedExprsAreNotNullable=T("assertIteratedExprsAreNotNullable");C.assertIteratedExprsAreNotNullable=P.assertIteratedExprsAreNotNullable=N.prototype.assertIteratedExprsAreNotNullable=E.prototype.assertIteratedExprsAreNotNullable=F.prototype.assertIteratedExprsAreNotNullable=L.prototype.assertIteratedExprsAreNotNullable=function(r){};S.prototype.assertIteratedExprsAreNotNullable=function(r){for(let e=0;e<this.terms.length;e++)this.terms[e].assertIteratedExprsAreNotNullable(r)};w.prototype.assertIteratedExprsAreNotNullable=function(r){for(let e=0;e<this.factors.length;e++)this.factors[e].assertIteratedExprsAreNotNullable(r)};D.prototype.assertIteratedExprsAreNotNullable=function(r){if(this.expr.assertIteratedExprsAreNotNullable(r),this.expr.isNullable(r))throw Gn(this,[])};Y.prototype.assertIteratedExprsAreNotNullable=B.prototype.assertIteratedExprsAreNotNullable=M.prototype.assertIteratedExprsAreNotNullable=G.prototype.assertIteratedExprsAreNotNullable=function(r){this.expr.assertIteratedExprsAreNotNullable(r)};b.prototype.assertIteratedExprsAreNotNullable=function(r){this.args.forEach(e=>{e.assertIteratedExprsAreNotNullable(r)})};class We{constructor(e){this.matchLength=e}get ctorName(){throw new Error("subclass responsibility")}numChildren(){return this.children?this.children.length:0}childAt(e){if(this.children)return this.children[e]}indexOfChild(e){return this.children.indexOf(e)}hasChildren(){return this.numChildren()>0}hasNoChildren(){return!this.hasChildren()}onlyChild(){if(this.numChildren()!==1)throw new Error("cannot get only child of a node of type "+this.ctorName+" (it has "+this.numChildren()+" children)");return this.firstChild()}firstChild(){if(this.hasNoChildren())throw new Error("cannot get first child of a "+this.ctorName+" node, which has no children");return this.childAt(0)}lastChild(){if(this.hasNoChildren())throw new Error("cannot get last child of a "+this.ctorName+" node, which has no children");return this.childAt(this.numChildren()-1)}childBefore(e){const n=this.indexOfChild(e);if(n<0)throw new Error("Node.childBefore() called w/ an argument that is not a child");if(n===0)throw new Error("cannot get child before first child");return this.childAt(n-1)}childAfter(e){const n=this.indexOfChild(e);if(n<0)throw new Error("Node.childAfter() called w/ an argument that is not a child");if(n===this.numChildren()-1)throw new Error("cannot get child after last child");return this.childAt(n+1)}isTerminal(){return!1}isNonterminal(){return!1}isIteration(){return!1}isOptional(){return!1}}class ae extends We{get ctorName(){return"_terminal"}isTerminal(){return!0}get primitiveValue(){throw new Error("The `primitiveValue` property was removed in Ohm v17.")}}class Ur extends We{constructor(e,n,t,s){super(s),this.ruleName=e,this.children=n,this.childOffsets=t}get ctorName(){return this.ruleName}isNonterminal(){return!0}isLexical(){return kn(this.ctorName)}isSyntactic(){return ne(this.ctorName)}}class Un extends We{constructor(e,n,t,s){super(t),this.children=e,this.childOffsets=n,this.optional=s}get ctorName(){return"_iter"}isIteration(){return!0}isOptional(){return this.optional}}f.prototype.eval=T("eval");C.eval=function(r){const{inputStream:e}=r,n=e.pos,t=e.nextCodePoint();return t!==void 0?(r.pushBinding(new ae(String.fromCodePoint(t).length),n),!0):(r.processFailure(n,this),!1)};P.eval=function(r){const{inputStream:e}=r,n=e.pos;return e.atEnd()?(r.pushBinding(new ae(0),n),!0):(r.processFailure(n,this),!1)};N.prototype.eval=function(r){const{inputStream:e}=r,n=e.pos;return e.matchString(this.obj)?(r.pushBinding(new ae(this.obj.length),n),!0):(r.processFailure(n,this),!1)};E.prototype.eval=function(r){const{inputStream:e}=r,n=e.pos,t=this.matchCodePoint?e.nextCodePoint():e.nextCharCode();return t!==void 0&&this.from.codePointAt(0)<=t&&t<=this.to.codePointAt(0)?(r.pushBinding(new ae(String.fromCodePoint(t).length),n),!0):(r.processFailure(n,this),!1)};F.prototype.eval=function(r){return r.eval(r.currentApplication().args[this.index])};G.prototype.eval=function(r){r.enterLexifiedContext();const e=r.eval(this.expr);return r.exitLexifiedContext(),e};S.prototype.eval=function(r){for(let e=0;e<this.terms.length;e++)if(r.eval(this.terms[e]))return!0;return!1};w.prototype.eval=function(r){for(let e=0;e<this.factors.length;e++){const n=this.factors[e];if(!r.eval(n))return!1}return!0};D.prototype.eval=function(r){const{inputStream:e}=r,n=e.pos,t=this.getArity(),s=[],a=[];for(;s.length<t;)s.push([]),a.push([]);let i=0,g=n,o;for(;i<this.maxNumMatches&&r.eval(this.expr);){if(e.pos===g)throw Gn(this,r._applicationStack);g=e.pos,i++;const u=r._bindings.splice(r._bindings.length-t,t),p=r._bindingOffsets.splice(r._bindingOffsets.length-t,t);for(o=0;o<u.length;o++)s[o].push(u[o]),a[o].push(p[o])}if(i<this.minNumMatches)return!1;let l=r.posToOffset(n),c=0;if(i>0){const u=s[t-1],p=a[t-1],h=p[p.length-1]+u[u.length-1].matchLength;l=a[0][0],c=h-l}const d=this instanceof Y;for(o=0;o<s.length;o++)r._bindings.push(new Un(s[o],a[o],c,d)),r._bindingOffsets.push(l);return!0};B.prototype.eval=function(r){const{inputStream:e}=r,n=e.pos;r.pushFailuresInfo();const t=r.eval(this.expr);return r.popFailuresInfo(),t?(r.processFailure(n,this),!1):(e.pos=n,!0)};M.prototype.eval=function(r){const{inputStream:e}=r,n=e.pos;return r.eval(this.expr)?(e.pos=n,!0):!1};b.prototype.eval=function(r){const e=r.currentApplication(),n=e?e.args:[],t=this.substituteParams(n),s=r.getCurrentPosInfo();if(s.isActive(t))return t.handleCycle(r);const a=t.toMemoKey(),i=s.memo[a];if(i&&s.shouldUseMemoizedResult(i)){if(r.hasNecessaryInfo(i))return r.useMemoizedResult(r.inputStream.pos,i);delete s.memo[a]}return t.reallyEval(r)};b.prototype.handleCycle=function(r){const e=r.getCurrentPosInfo(),{currentLeftRecursion:n}=e,t=this.toMemoKey();let s=e.memo[t];return n&&n.headApplication.toMemoKey()===t?s.updateInvolvedApplicationMemoKeys():s||(s=e.memoize(t,{matchLength:0,examinedLength:0,value:!1,rightmostFailureOffset:-1}),e.startLeftRecursion(this,s)),r.useMemoizedResult(r.inputStream.pos,s)};b.prototype.reallyEval=function(r){const{inputStream:e}=r,n=e.pos,t=r.getCurrentPosInfo(),s=r.grammar.rules[this.ruleName],{body:a}=s,{description:i}=s;r.enterApplication(t,this),i&&r.pushFailuresInfo();const g=e.examinedLength;e.examinedLength=0;let o=this.evalOnce(a,r);const l=t.currentLeftRecursion,c=this.toMemoKey(),d=l&&l.headApplication.toMemoKey()===c;let u;r.doNotMemoize?r.doNotMemoize=!1:d?(o=this.growSeedResult(a,r,n,l,o),t.endLeftRecursion(),u=l,u.examinedLength=e.examinedLength-n,u.rightmostFailureOffset=r._getRightmostFailureOffset(),t.memoize(c,u)):(!l||!l.isInvolved(c))&&(u=t.memoize(c,{matchLength:e.pos-n,examinedLength:e.examinedLength-n,value:o,failuresAtRightmostPosition:r.cloneRecordedFailures(),rightmostFailureOffset:r._getRightmostFailureOffset()}));const p=!!o;if(i&&(r.popFailuresInfo(),p||r.processFailure(n,this),u&&(u.failuresAtRightmostPosition=r.cloneRecordedFailures())),r.isTracing()&&u){const h=r.getTraceEntry(n,this,p,p?[o]:[]);d&&(Z(h.terminatingLREntry!=null||!p),h.isHeadOfLeftRecursion=!0),u.traceEntry=h}return e.examinedLength=Math.max(e.examinedLength,g),r.exitApplication(t,o),p};b.prototype.evalOnce=function(r,e){const{inputStream:n}=e,t=n.pos;if(e.eval(r)){const s=r.getArity(),a=e._bindings.splice(e._bindings.length-s,s),i=e._bindingOffsets.splice(e._bindingOffsets.length-s,s),g=n.pos-t;return new Ur(this.ruleName,a,i,g)}else return!1};b.prototype.growSeedResult=function(r,e,n,t,s){if(!s)return!1;const{inputStream:a}=e;for(;;){if(t.matchLength=a.pos-n,t.value=s,t.failuresAtRightmostPosition=e.cloneRecordedFailures(),e.isTracing()){const i=e.trace[e.trace.length-1];t.traceEntry=new X(e.input,n,a.pos,this,!0,[s],[i.clone()])}if(a.pos=n,s=this.evalOnce(r,e),a.pos-n<=t.matchLength)break;e.isTracing()&&e.trace.splice(-2,1)}return e.isTracing()&&t.traceEntry.recordLRTermination(e.trace.pop(),s),a.pos=n+t.matchLength,t.value};L.prototype.eval=function(r){const{inputStream:e}=r,n=e.pos,t=e.next();return t&&this.pattern.test(t)?(r.pushBinding(new ae(t.length),n),!0):(r.processFailure(n,this),!1)};f.prototype.getArity=T("getArity");C.getArity=P.getArity=N.prototype.getArity=E.prototype.getArity=F.prototype.getArity=b.prototype.getArity=L.prototype.getArity=function(){return 1};S.prototype.getArity=function(){return this.terms.length===0?0:this.terms[0].getArity()};w.prototype.getArity=function(){let r=0;for(let e=0;e<this.factors.length;e++)r+=this.factors[e].getArity();return r};D.prototype.getArity=function(){return this.expr.getArity()};B.prototype.getArity=function(){return 0};M.prototype.getArity=G.prototype.getArity=function(){return this.expr.getArity()};function U(r,e){const n={};if(r.source&&e){const t=r.source.relativeTo(e);n.sourceInterval=[t.startIdx,t.endIdx]}return n}f.prototype.outputRecipe=T("outputRecipe");C.outputRecipe=function(r,e){return["any",U(this,e)]};P.outputRecipe=function(r,e){return["end",U(this,e)]};N.prototype.outputRecipe=function(r,e){return["terminal",U(this,e),this.obj]};E.prototype.outputRecipe=function(r,e){return["range",U(this,e),this.from,this.to]};F.prototype.outputRecipe=function(r,e){return["param",U(this,e),this.index]};S.prototype.outputRecipe=function(r,e){return["alt",U(this,e)].concat(this.terms.map(n=>n.outputRecipe(r,e)))};Ae.prototype.outputRecipe=function(r,e){return this.terms[0].outputRecipe(r,e)};_e.prototype.outputRecipe=function(r,e){const n=this.terms.slice(0,this.expansionPos),t=this.terms.slice(this.expansionPos+1);return["splice",U(this,e),n.map(s=>s.outputRecipe(r,e)),t.map(s=>s.outputRecipe(r,e))]};w.prototype.outputRecipe=function(r,e){return["seq",U(this,e)].concat(this.factors.map(n=>n.outputRecipe(r,e)))};se.prototype.outputRecipe=oe.prototype.outputRecipe=Y.prototype.outputRecipe=B.prototype.outputRecipe=M.prototype.outputRecipe=G.prototype.outputRecipe=function(r,e){return[this.constructor.name.toLowerCase(),U(this,e),this.expr.outputRecipe(r,e)]};b.prototype.outputRecipe=function(r,e){return["app",U(this,e),this.ruleName,this.args.map(n=>n.outputRecipe(r,e))]};L.prototype.outputRecipe=function(r,e){return["unicodeChar",U(this,e),this.category]};f.prototype.introduceParams=T("introduceParams");C.introduceParams=P.introduceParams=N.prototype.introduceParams=E.prototype.introduceParams=F.prototype.introduceParams=L.prototype.introduceParams=function(r){return this};S.prototype.introduceParams=function(r){return this.terms.forEach((e,n,t)=>{t[n]=e.introduceParams(r)}),this};w.prototype.introduceParams=function(r){return this.factors.forEach((e,n,t)=>{t[n]=e.introduceParams(r)}),this};D.prototype.introduceParams=B.prototype.introduceParams=M.prototype.introduceParams=G.prototype.introduceParams=function(r){return this.expr=this.expr.introduceParams(r),this};b.prototype.introduceParams=function(r){const e=r.indexOf(this.ruleName);if(e>=0){if(this.args.length>0)throw new Error("Parameterized rules cannot be passed as arguments to another rule.");return new F(e).withSource(this.source)}else return this.args.forEach((n,t,s)=>{s[t]=n.introduceParams(r)}),this};f.prototype.isNullable=function(r){return this._isNullable(r,Object.create(null))};f.prototype._isNullable=T("_isNullable");C._isNullable=E.prototype._isNullable=F.prototype._isNullable=oe.prototype._isNullable=L.prototype._isNullable=function(r,e){return!1};P._isNullable=function(r,e){return!0};N.prototype._isNullable=function(r,e){return typeof this.obj=="string"?this.obj==="":!1};S.prototype._isNullable=function(r,e){return this.terms.length===0||this.terms.some(n=>n._isNullable(r,e))};w.prototype._isNullable=function(r,e){return this.factors.every(n=>n._isNullable(r,e))};se.prototype._isNullable=Y.prototype._isNullable=B.prototype._isNullable=M.prototype._isNullable=function(r,e){return!0};G.prototype._isNullable=function(r,e){return this.expr._isNullable(r,e)};b.prototype._isNullable=function(r,e){const n=this.toMemoKey();if(!Object.prototype.hasOwnProperty.call(e,n)){const{body:t}=r.rules[this.ruleName],s=t.substituteParams(this.args);e[n]=!1,e[n]=s._isNullable(r,e)}return e[n]};f.prototype.substituteParams=T("substituteParams");C.substituteParams=P.substituteParams=N.prototype.substituteParams=E.prototype.substituteParams=L.prototype.substituteParams=function(r){return this};F.prototype.substituteParams=function(r){return r[this.index]};S.prototype.substituteParams=function(r){return new S(this.terms.map(e=>e.substituteParams(r)))};w.prototype.substituteParams=function(r){return new w(this.factors.map(e=>e.substituteParams(r)))};D.prototype.substituteParams=B.prototype.substituteParams=M.prototype.substituteParams=G.prototype.substituteParams=function(r){return new this.constructor(this.expr.substituteParams(r))};b.prototype.substituteParams=function(r){if(this.args.length===0)return this;{const e=this.args.map(n=>n.substituteParams(r));return new b(this.ruleName,e)}};function pn(r){return/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(r)}function Je(r){const e=Object.create(null);r.forEach(n=>{e[n]=(e[n]||0)+1}),Object.keys(e).forEach(n=>{if(e[n]<=1)return;let t=1;r.forEach((s,a)=>{s===n&&(r[a]=s+"_"+t++)})})}f.prototype.toArgumentNameList=T("toArgumentNameList");C.toArgumentNameList=function(r,e){return["any"]};P.toArgumentNameList=function(r,e){return["end"]};N.prototype.toArgumentNameList=function(r,e){return typeof this.obj=="string"&&/^[_a-zA-Z0-9]+$/.test(this.obj)?["_"+this.obj]:["$"+r]};E.prototype.toArgumentNameList=function(r,e){let n=this.from+"_to_"+this.to;return pn(n)||(n="_"+n),pn(n)||(n="$"+r),[n]};S.prototype.toArgumentNameList=function(r,e){const n=this.terms.map(a=>a.toArgumentNameList(r,!0)),t=[],s=n[0].length;for(let a=0;a<s;a++){const i=[];for(let o=0;o<this.terms.length;o++)i.push(n[o][a]);const g=Fn(i);t.push(g.join("_or_"))}return e||Je(t),t};w.prototype.toArgumentNameList=function(r,e){let n=[];return this.factors.forEach(t=>{const s=t.toArgumentNameList(r,!0);n=n.concat(s),r+=s.length}),e||Je(n),n};D.prototype.toArgumentNameList=function(r,e){const n=this.expr.toArgumentNameList(r,e).map(t=>t[t.length-1]==="s"?t+"es":t+"s");return e||Je(n),n};Y.prototype.toArgumentNameList=function(r,e){return this.expr.toArgumentNameList(r,e).map(n=>"opt"+n[0].toUpperCase()+n.slice(1))};B.prototype.toArgumentNameList=function(r,e){return[]};M.prototype.toArgumentNameList=G.prototype.toArgumentNameList=function(r,e){return this.expr.toArgumentNameList(r,e)};b.prototype.toArgumentNameList=function(r,e){return[this.ruleName]};L.prototype.toArgumentNameList=function(r,e){return["$"+r]};F.prototype.toArgumentNameList=function(r,e){return["param"+this.index]};f.prototype.toDisplayString=T("toDisplayString");S.prototype.toDisplayString=w.prototype.toDisplayString=function(){return this.source?this.source.trimmed().contents:"["+this.constructor.name+"]"};C.toDisplayString=P.toDisplayString=D.prototype.toDisplayString=B.prototype.toDisplayString=M.prototype.toDisplayString=G.prototype.toDisplayString=N.prototype.toDisplayString=E.prototype.toDisplayString=F.prototype.toDisplayString=function(){return this.toString()};b.prototype.toDisplayString=function(){if(this.args.length>0){const r=this.args.map(e=>e.toDisplayString());return this.ruleName+"<"+r.join(",")+">"}else return this.ruleName};L.prototype.toDisplayString=function(){return"Unicode ["+this.category+"] character"};function $r(r){return r==="description"||r==="string"||r==="code"}class V{constructor(e,n,t){if(!$r(t))throw new Error("invalid Failure type: "+t);this.pexpr=e,this.text=n,this.type=t,this.fluffy=!1}getPExpr(){return this.pexpr}getText(){return this.text}getType(){return this.type}isDescription(){return this.type==="description"}isStringTerminal(){return this.type==="string"}isCode(){return this.type==="code"}isFluffy(){return this.fluffy}makeFluffy(){this.fluffy=!0}clearFluffy(){this.fluffy=!1}subsumes(e){return this.getText()===e.getText()&&this.type===e.type&&(!this.isFluffy()||this.isFluffy()&&e.isFluffy())}toString(){return this.type==="string"?JSON.stringify(this.getText()):this.getText()}clone(){const e=new V(this.pexpr,this.text,this.type);return this.isFluffy()&&e.makeFluffy(),e}toKey(){return this.toString()+"#"+this.type}}f.prototype.toFailure=T("toFailure");C.toFailure=function(r){return new V(this,"any object","description")};P.toFailure=function(r){return new V(this,"end of input","description")};N.prototype.toFailure=function(r){return new V(this,this.obj,"string")};E.prototype.toFailure=function(r){return new V(this,JSON.stringify(this.from)+".."+JSON.stringify(this.to),"code")};B.prototype.toFailure=function(r){const e=this.expr===C?"nothing":"not "+this.expr.toFailure(r);return new V(this,e,"description")};M.prototype.toFailure=function(r){return this.expr.toFailure(r)};b.prototype.toFailure=function(r){let{description:e}=r.rules[this.ruleName];return e||(e=(/^[aeiouAEIOU]/.test(this.ruleName)?"an":"a")+" "+this.ruleName),new V(this,e,"description")};L.prototype.toFailure=function(r){return new V(this,"a Unicode ["+this.category+"] character","description")};S.prototype.toFailure=function(r){const n="("+this.terms.map(t=>t.toFailure(r)).join(" or ")+")";return new V(this,n,"description")};w.prototype.toFailure=function(r){const n="("+this.factors.map(t=>t.toFailure(r)).join(" ")+")";return new V(this,n,"description")};D.prototype.toFailure=function(r){const e="("+this.expr.toFailure(r)+this.operator+")";return new V(this,e,"description")};f.prototype.toString=T("toString");C.toString=function(){return"any"};P.toString=function(){return"end"};N.prototype.toString=function(){return JSON.stringify(this.obj)};E.prototype.toString=function(){return JSON.stringify(this.from)+".."+JSON.stringify(this.to)};F.prototype.toString=function(){return"$"+this.index};G.prototype.toString=function(){return"#("+this.expr.toString()+")"};S.prototype.toString=function(){return this.terms.length===1?this.terms[0].toString():"("+this.terms.map(r=>r.toString()).join(" | ")+")"};w.prototype.toString=function(){return this.factors.length===1?this.factors[0].toString():"("+this.factors.map(r=>r.toString()).join(" ")+")"};D.prototype.toString=function(){return this.expr+this.operator};B.prototype.toString=function(){return"~"+this.expr};M.prototype.toString=function(){return"&"+this.expr};b.prototype.toString=function(){if(this.args.length>0){const r=this.args.map(e=>e.toString());return this.ruleName+"<"+r.join(",")+">"}else return this.ruleName};L.prototype.toString=function(){return"\\p{"+this.category+"}"};class Ye extends f{constructor(e){super(),this.obj=e}_getString(e){const n=e.currentApplication().args[this.obj.index];return Z(n instanceof N,"expected a Terminal expression"),n.obj}allowsSkippingPrecedingSpace(){return!0}eval(e){const{inputStream:n}=e,t=n.pos,s=this._getString(e);return n.matchString(s,!0)?(e.pushBinding(new ae(s.length),t),!0):(e.processFailure(t,this),!1)}getArity(){return 1}substituteParams(e){return new Ye(this.obj.substituteParams(e))}toDisplayString(){return this.obj.toDisplayString()+" (case-insensitive)"}toFailure(e){return new V(this,this.obj.toFailure(e)+" (case-insensitive)","description")}_isNullable(e,n){return this.obj._isNullable(e,n)}}let $n;qn(r=>{$n=r.rules.applySyntactic.body});const Oe=new b("spaces");class zr{constructor(e,n,t){this.matcher=e,this.startExpr=n,this.grammar=e.grammar,this.input=e.getInput(),this.inputStream=new Le(this.input),this.memoTable=e._memoTable,this.userData=void 0,this.doNotMemoize=!1,this._bindings=[],this._bindingOffsets=[],this._applicationStack=[],this._posStack=[0],this.inLexifiedContextStack=[!1],this.rightmostFailurePosition=-1,this._rightmostFailurePositionStack=[],this._recordedFailuresStack=[],t!==void 0&&(this.positionToRecordFailures=t,this.recordedFailures=Object.create(null))}posToOffset(e){return e-this._posStack[this._posStack.length-1]}enterApplication(e,n){this._posStack.push(this.inputStream.pos),this._applicationStack.push(n),this.inLexifiedContextStack.push(!1),e.enter(n),this._rightmostFailurePositionStack.push(this.rightmostFailurePosition),this.rightmostFailurePosition=-1}exitApplication(e,n){const t=this._posStack.pop();this._applicationStack.pop(),this.inLexifiedContextStack.pop(),e.exit(),this.rightmostFailurePosition=Math.max(this.rightmostFailurePosition,this._rightmostFailurePositionStack.pop()),n&&this.pushBinding(n,t)}enterLexifiedContext(){this.inLexifiedContextStack.push(!0)}exitLexifiedContext(){this.inLexifiedContextStack.pop()}currentApplication(){return this._applicationStack[this._applicationStack.length-1]}inSyntacticContext(){const e=this.currentApplication();return e?e.isSyntactic()&&!this.inLexifiedContext():this.startExpr.factors[0].isSyntactic()}inLexifiedContext(){return this.inLexifiedContextStack[this.inLexifiedContextStack.length-1]}skipSpaces(){return this.pushFailuresInfo(),this.eval(Oe),this.popBinding(),this.popFailuresInfo(),this.inputStream.pos}skipSpacesIfInSyntacticContext(){return this.inSyntacticContext()?this.skipSpaces():this.inputStream.pos}maybeSkipSpacesBefore(e){return e.allowsSkippingPrecedingSpace()&&e!==Oe?this.skipSpacesIfInSyntacticContext():this.inputStream.pos}pushBinding(e,n){this._bindings.push(e),this._bindingOffsets.push(this.posToOffset(n))}popBinding(){this._bindings.pop(),this._bindingOffsets.pop()}numBindings(){return this._bindings.length}truncateBindings(e){for(;this._bindings.length>e;)this.popBinding()}getCurrentPosInfo(){return this.getPosInfo(this.inputStream.pos)}getPosInfo(e){let n=this.memoTable[e];return n||(n=this.memoTable[e]=new Tr),n}processFailure(e,n){if(this.rightmostFailurePosition=Math.max(this.rightmostFailurePosition,e),this.recordedFailures&&e===this.positionToRecordFailures){const t=this.currentApplication();t&&(n=n.substituteParams(t.args)),this.recordFailure(n.toFailure(this.grammar),!1)}}recordFailure(e,n){const t=e.toKey();this.recordedFailures[t]?this.recordedFailures[t].isFluffy()&&!e.isFluffy()&&this.recordedFailures[t].clearFluffy():this.recordedFailures[t]=n?e.clone():e}recordFailures(e,n){Object.keys(e).forEach(t=>{this.recordFailure(e[t],n)})}cloneRecordedFailures(){if(!this.recordedFailures)return;const e=Object.create(null);return Object.keys(this.recordedFailures).forEach(n=>{e[n]=this.recordedFailures[n].clone()}),e}getRightmostFailurePosition(){return this.rightmostFailurePosition}_getRightmostFailureOffset(){return this.rightmostFailurePosition>=0?this.posToOffset(this.rightmostFailurePosition):-1}getMemoizedTraceEntry(e,n){const t=this.memoTable[e];if(t&&n instanceof b){const s=t.memo[n.toMemoKey()];if(s&&s.traceEntry){const a=s.traceEntry.cloneWithExpr(n);return a.isMemoized=!0,a}}return null}getTraceEntry(e,n,t,s){if(n instanceof b){const a=this.currentApplication(),i=a?a.args:[];n=n.substituteParams(i)}return this.getMemoizedTraceEntry(e,n)||new X(this.input,e,this.inputStream.pos,n,t,s,this.trace)}isTracing(){return!!this.trace}hasNecessaryInfo(e){return this.trace&&!e.traceEntry?!1:this.recordedFailures&&this.inputStream.pos+e.rightmostFailureOffset===this.positionToRecordFailures?!!e.failuresAtRightmostPosition:!0}useMemoizedResult(e,n){this.trace&&this.trace.push(n.traceEntry);const t=this.inputStream.pos+n.rightmostFailureOffset;return this.rightmostFailurePosition=Math.max(this.rightmostFailurePosition,t),this.recordedFailures&&this.positionToRecordFailures===t&&n.failuresAtRightmostPosition&&this.recordFailures(n.failuresAtRightmostPosition,!0),this.inputStream.examinedLength=Math.max(this.inputStream.examinedLength,n.examinedLength+e),n.value?(this.inputStream.pos+=n.matchLength,this.pushBinding(n.value,e),!0):!1}eval(e){const{inputStream:n}=this,t=this._bindings.length,s=this.userData;let a;this.recordedFailures&&(a=this.recordedFailures,this.recordedFailures=Object.create(null));const i=n.pos,g=this.maybeSkipSpacesBefore(e);let o;this.trace&&(o=this.trace,this.trace=[]);const l=e.eval(this);if(this.trace){const c=this._bindings.slice(t),d=this.getTraceEntry(g,e,l,c);d.isImplicitSpaces=e===Oe,d.isRootNode=e===this.startExpr,o.push(d),this.trace=o}return l?this.recordedFailures&&n.pos===this.positionToRecordFailures&&Object.keys(this.recordedFailures).forEach(c=>{this.recordedFailures[c].makeFluffy()}):(n.pos=i,this.truncateBindings(t),this.userData=s),this.recordedFailures&&this.recordFailures(a,!1),e===$n&&this.skipSpaces(),l}getMatchResult(){this.grammar._setUpMatchState(this),this.eval(this.startExpr);let e;this.recordedFailures&&(e=Object.keys(this.recordedFailures).map(t=>this.recordedFailures[t]));const n=this._bindings[0];return n&&(n.grammar=this.grammar),new Hn(this.matcher,this.input,this.startExpr,n,this._bindingOffsets[0],this.rightmostFailurePosition,e)}getTrace(){this.trace=[];const e=this.getMatchResult(),n=this.trace[this.trace.length-1];return n.result=e,n}pushFailuresInfo(){this._rightmostFailurePositionStack.push(this.rightmostFailurePosition),this._recordedFailuresStack.push(this.recordedFailures)}popFailuresInfo(){this.rightmostFailurePosition=this._rightmostFailurePositionStack.pop(),this.recordedFailures=this._recordedFailuresStack.pop()}}class Wr{constructor(e){this.grammar=e,this._memoTable=[],this._input="",this._isMemoTableStale=!1}_resetMemoTable(){this._memoTable=[],this._isMemoTableStale=!1}getInput(){return this._input}setInput(e){return this._input!==e&&this.replaceInputRange(0,this._input.length,e),this}replaceInputRange(e,n,t){const s=this._input,a=this._memoTable;if(e<0||e>s.length||n<0||n>s.length||e>n)throw new Error("Invalid indices: "+e+" and "+n);this._input=s.slice(0,e)+t+s.slice(n),this._input!==s&&a.length>0&&(this._isMemoTableStale=!0);const i=a.slice(n);a.length=e;for(let g=0;g<t.length;g++)a.push(void 0);for(const g of i)a.push(g);for(let g=0;g<e;g++){const o=a[g];o&&o.clearObsoleteEntries(g,e)}return this}match(e,n={incremental:!0}){return this._match(this._getStartExpr(e),{incremental:n.incremental,tracing:!1})}trace(e,n={incremental:!0}){return this._match(this._getStartExpr(e),{incremental:n.incremental,tracing:!0})}_match(e,n={}){const t={tracing:!1,incremental:!0,positionToRecordFailures:void 0,...n};if(!t.incremental)this._resetMemoTable();else if(this._isMemoTableStale&&!this.grammar.supportsIncrementalParsing)throw mr(this.grammar);const s=new zr(this,e,t.positionToRecordFailures);return t.tracing?s.getTrace():s.getMatchResult()}_getStartExpr(e){const n=e||this.grammar.defaultStartRule;if(!n)throw new Error("Missing start rule argument -- the grammar has no default start rule.");const t=this.grammar.parseApplication(n);return new w([t,P])}}const le=[],Be=(r,e)=>Object.prototype.hasOwnProperty.call(r,e);class fn{constructor(e,n,t){this._node=e,this.source=n,this._baseInterval=t,e.isNonterminal()&&Z(n===t),this._childWrappers=[]}_forgetMemoizedResultFor(e){delete this._node[this._semantics.attributeKeys[e]],this.children.forEach(n=>{n._forgetMemoizedResultFor(e)})}child(e){if(!(0<=e&&e<this._node.numChildren()))return;let n=this._childWrappers[e];if(!n){const t=this._node.childAt(e),s=this._node.childOffsets[e],a=this._baseInterval.subInterval(s,t.matchLength),i=t.isNonterminal()?a:this._baseInterval;n=this._childWrappers[e]=this._semantics.wrap(t,a,i)}return n}_children(){for(let e=0;e<this._node.numChildren();e++)this.child(e);return this._childWrappers}isIteration(){return this._node.isIteration()}isTerminal(){return this._node.isTerminal()}isNonterminal(){return this._node.isNonterminal()}isSyntactic(){return this.isNonterminal()&&this._node.isSyntactic()}isLexical(){return this.isNonterminal()&&this._node.isLexical()}isOptional(){return this._node.isOptional()}iteration(e){const n=e||[],t=n.map(i=>i._node),s=new Un(t,[],-1,!1),a=this._semantics.wrap(s,null,null);return a._childWrappers=n,a}get children(){return this._children()}get ctorName(){return this._node.ctorName}get numChildren(){return this._node.numChildren()}get sourceString(){return this.source.contents}}class j{constructor(e,n){const t=this;if(this.grammar=e,this.checkedActionDicts=!1,this.Wrapper=class extends(n?n.Wrapper:fn){constructor(s,a,i){super(s,a,i),t.checkActionDictsIfHaventAlready(),this._semantics=t}toString(){return"[semantics wrapper for "+t.grammar.name+"]"}},this.super=n,n){if(!(e.equals(this.super.grammar)||e._inheritsFrom(this.super.grammar)))throw new Error("Cannot extend a semantics for grammar '"+this.super.grammar.name+"' for use with grammar '"+e.name+"' (not a sub-grammar)");this.operations=Object.create(this.super.operations),this.attributes=Object.create(this.super.attributes),this.attributeKeys=Object.create(null);for(const s in this.attributes)Object.defineProperty(this.attributeKeys,s,{value:un(s)})}else this.operations=Object.create(null),this.attributes=Object.create(null),this.attributeKeys=Object.create(null)}toString(){return"[semantics for "+this.grammar.name+"]"}checkActionDictsIfHaventAlready(){this.checkedActionDicts||(this.checkActionDicts(),this.checkedActionDicts=!0)}checkActionDicts(){let e;for(e in this.operations)this.operations[e].checkActionDict(this.grammar);for(e in this.attributes)this.attributes[e].checkActionDict(this.grammar)}toRecipe(e){function n(s){return s.super!==j.BuiltInSemantics._getSemantics()}let t=`(function(g) {
`;if(n(this)){t+="  var semantics = "+this.super.toRecipe(!0)+"(g";const s=this.super.grammar;let a=this.grammar;for(;a!==s;)t+=".superGrammar",a=a.superGrammar;t+=`);
`,t+="  return g.extendSemantics(semantics)"}else t+="  return g.createSemantics()";return["Operation","Attribute"].forEach(s=>{const a=this[s.toLowerCase()+"s"];Object.keys(a).forEach(i=>{const{actionDict:g,formals:o,builtInDefault:l}=a[i];let c=i;o.length>0&&(c+="("+o.join(", ")+")");let d;n(this)&&this.super[s.toLowerCase()+"s"][i]?d="extend"+s:d="add"+s,t+=`
    .`+d+"("+JSON.stringify(c)+", {";const u=[];Object.keys(g).forEach(p=>{if(g[p]!==l){let h=g[p].toString().trim();h=h.replace(/^.*\(/,"function("),u.push(`
      `+JSON.stringify(p)+": "+h)}}),t+=u.join(",")+`
    })`})}),t+=`;
  })`,e||(t=`(function() {
  var grammar = this.fromRecipe(`+this.grammar.toRecipe()+`);
  var semantics = `+t+`(grammar);
  return semantics;
});
`),t}addOperationOrAttribute(e,n,t){const s=e+"s",a=hn(n,e),{name:i}=a,{formals:g}=a;this.assertNewName(i,e);const o=Jr(e,i,d),l={_default:o};Object.keys(t).forEach(u=>{l[u]=t[u]});const c=e==="operation"?new be(i,g,l,o):new Me(i,l,o);c.checkActionDict(this.grammar),this[s][i]=c;function d(...u){const p=this._semantics[s][i];if(arguments.length!==p.formals.length)throw new Error("Invalid number of arguments passed to "+i+" "+e+" (expected "+p.formals.length+", got "+arguments.length+")");const h=Object.create(null);for(const[ee,de]of Object.entries(u)){const or=p.formals[ee];h[or]=de}const m=this.args;this.args=h;const v=p.execute(this._semantics,this);return this.args=m,v}e==="operation"?(this.Wrapper.prototype[i]=d,this.Wrapper.prototype[i].toString=function(){return"["+i+" operation]"}):(Object.defineProperty(this.Wrapper.prototype,i,{get:d,configurable:!0}),Object.defineProperty(this.attributeKeys,i,{value:un(i)}))}extendOperationOrAttribute(e,n,t){const s=e+"s";if(hn(n,"attribute"),!(this.super&&n in this.super[s]))throw new Error("Cannot extend "+e+" '"+n+"': did not inherit an "+e+" with that name");if(Be(this[s],n))throw new Error("Cannot extend "+e+" '"+n+"' again");const a=this[s][n].formals,i=this[s][n].actionDict,g=Object.create(i);Object.keys(t).forEach(o=>{g[o]=t[o]}),this[s][n]=e==="operation"?new be(n,a,g):new Me(n,g),this[s][n].checkActionDict(this.grammar)}assertNewName(e,n){if(Be(fn.prototype,e))throw new Error("Cannot add "+n+" '"+e+"': that's a reserved name");if(e in this.operations)throw new Error("Cannot add "+n+" '"+e+"': an operation with that name already exists");if(e in this.attributes)throw new Error("Cannot add "+n+" '"+e+"': an attribute with that name already exists")}wrap(e,n,t){const s=t||n;return e instanceof this.Wrapper?e:new this.Wrapper(e,n,s)}}function hn(r,e){if(!j.prototypeGrammar)return Z(r.indexOf("(")===-1),{name:r,formals:[]};const n=j.prototypeGrammar.match(r,e==="operation"?"OperationSignature":"AttributeSignature");if(n.failed())throw new Error(n.message);return j.prototypeGrammarSemantics(n).parse()}function Jr(r,e,n){return function(...t){const a=(this._semantics.operations[e]||this._semantics.attributes[e]).formals.map(i=>this.args[i]);if(!this.isIteration()&&t.length===1)return n.apply(t[0],a);throw Or(this.ctorName,e,r,le)}}j.createSemantics=function(r,e){const n=new j(r,e!==void 0?e:j.BuiltInSemantics._getSemantics()),t=function(a){if(!(a instanceof Hn))throw new TypeError("Semantics expected a MatchResult, but got "+Bn(a));if(a.failed())throw new TypeError("cannot apply Semantics to "+a.toString());const i=a._cst;if(i.grammar!==r)throw new Error("Cannot use a MatchResult from grammar '"+i.grammar.name+"' with a semantics for '"+r.name+"'");const g=new Le(a.input);return n.wrap(i,g.interval(a._cstOffset,a.input.length))};return t.addOperation=function(s,a){return n.addOperationOrAttribute("operation",s,a),t},t.extendOperation=function(s,a){return n.extendOperationOrAttribute("operation",s,a),t},t.addAttribute=function(s,a){return n.addOperationOrAttribute("attribute",s,a),t},t.extendAttribute=function(s,a){return n.extendOperationOrAttribute("attribute",s,a),t},t._getActionDict=function(s){const a=n.operations[s]||n.attributes[s];if(!a)throw new Error('"'+s+'" is not a valid operation or attribute name in this semantics for "'+r.name+'"');return a.actionDict},t._remove=function(s){let a;return s in n.operations?(a=n.operations[s],delete n.operations[s]):s in n.attributes&&(a=n.attributes[s],delete n.attributes[s]),delete n.Wrapper.prototype[s],a},t.getOperationNames=function(){return Object.keys(n.operations)},t.getAttributeNames=function(){return Object.keys(n.attributes)},t.getGrammar=function(){return n.grammar},t.toRecipe=function(s){return n.toRecipe(s)},t.toString=n.toString.bind(n),t._getSemantics=function(){return n},t};class be{constructor(e,n,t,s){this.name=e,this.formals=n,this.actionDict=t,this.builtInDefault=s}checkActionDict(e){e._checkTopDownActionDict(this.typeName,this.name,this.actionDict)}execute(e,n){try{const{ctorName:t}=n._node;let s=this.actionDict[t];return s?(le.push([this,t]),s.apply(n,n._children())):n.isNonterminal()&&(s=this.actionDict._nonterminal,s)?(le.push([this,"_nonterminal",t]),s.apply(n,n._children())):(le.push([this,"default action",t]),this.actionDict._default.apply(n,n._children()))}finally{le.pop()}}}be.prototype.typeName="operation";class Me extends be{constructor(e,n,t){super(e,[],n,t)}execute(e,n){const t=n._node,s=e.attributeKeys[this.name];return Be(t,s)||(t[s]=be.prototype.execute.call(this,e,n)),t[s]}}Me.prototype.typeName="attribute";const bn=["_iter","_terminal","_nonterminal","_default"];function mn(r){return Object.keys(r.rules).sort().map(e=>r.rules[e])}const Yr=r=>r.replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");let zn,Wn;class k{constructor(e,n,t,s){if(this.name=e,this.superGrammar=n,this.rules=t,s){if(!(s in t))throw new Error("Invalid start rule: '"+s+"' is not a rule in grammar '"+e+"'");this.defaultStartRule=s}this._matchStateInitializer=void 0,this.supportsIncrementalParsing=!0}matcher(){return new Wr(this)}isBuiltIn(){return this===k.ProtoBuiltInRules||this===k.BuiltInRules}equals(e){if(this===e)return!0;if(e==null||this.name!==e.name||this.defaultStartRule!==e.defaultStartRule||!(this.superGrammar===e.superGrammar||this.superGrammar.equals(e.superGrammar)))return!1;const n=mn(this),t=mn(e);return n.length===t.length&&n.every((s,a)=>s.description===t[a].description&&s.formals.join(",")===t[a].formals.join(",")&&s.body.toString()===t[a].body.toString())}match(e,n){const t=this.matcher();return t.replaceInputRange(0,0,e),t.match(n)}trace(e,n){const t=this.matcher();return t.replaceInputRange(0,0,e),t.trace(n)}createSemantics(){return j.createSemantics(this)}extendSemantics(e){return j.createSemantics(this,e._getSemantics())}_checkTopDownActionDict(e,n,t){const s=[];for(const a in t){const i=t[a];if(!bn.includes(a)&&!(a in this.rules)){s.push(`'${a}' is not a valid semantic action for '${this.name}'`);continue}if(typeof i!="function"){s.push(`'${a}' must be a function in an action dictionary for '${this.name}'`);continue}const o=i.length,l=this._topDownActionArity(a);if(o!==l){let c;a==="_iter"||a==="_nonterminal"?c=`it should use a rest parameter, e.g. \`${a}(...children) {}\`. NOTE: this is new in Ohm v16 — see https://ohmjs.org/d/ati for details.`:c=`expected ${l}, got ${o}`,s.push(`Semantic action '${a}' has the wrong arity: ${c}`)}}if(s.length>0){const a=s.map(g=>"- "+g),i=new Error([`Found errors in the action dictionary of the '${n}' ${e}:`,...a].join(`
`));throw i.problems=s,i}}_topDownActionArity(e){return bn.includes(e)?0:this.rules[e].body.getArity()}_inheritsFrom(e){let n=this.superGrammar;for(;n;){if(n.equals(e,!0))return!0;n=n.superGrammar}return!1}toRecipe(e=void 0){const n={};this.source&&(n.source=this.source.contents);let t=null;this.defaultStartRule&&(t=this.defaultStartRule);const s={};Object.keys(this.rules).forEach(g=>{const o=this.rules[g],{body:l}=o,c=!this.superGrammar||!this.superGrammar.rules[g];let d;c?d="define":d=l instanceof Ae?"extend":"override";const u={};if(o.source&&this.source){const m=o.source.relativeTo(this.source);u.sourceInterval=[m.startIdx,m.endIdx]}const p=c?o.description:null,h=l.outputRecipe(o.formals,this.source);s[g]=[d,u,p,o.formals,h]});let a="null";e?a=e:this.superGrammar&&!this.superGrammar.isBuiltIn()&&(a=this.superGrammar.toRecipe());const i=[...["grammar",n,this.name].map(JSON.stringify),a,...[t,s].map(JSON.stringify)];return Yr(`[${i.join(",")}]`)}toOperationActionDictionaryTemplate(){return this._toOperationOrAttributeActionDictionaryTemplate()}toAttributeActionDictionaryTemplate(){return this._toOperationOrAttributeActionDictionaryTemplate()}_toOperationOrAttributeActionDictionaryTemplate(){const e=new te;e.append("{");let n=!0;for(const t in this.rules){const{body:s}=this.rules[t];n?n=!1:e.append(","),e.append(`
`),e.append("  "),this.addSemanticActionTemplate(t,s,e)}return e.append(`
}`),e.contents()}addSemanticActionTemplate(e,n,t){t.append(e),t.append(": function(");const s=this._topDownActionArity(e);t.append(we("_",s).join(", ")),t.append(`) {
`),t.append("  }")}parseApplication(e){let n;if(e.indexOf("<")===-1)n=new b(e);else{const s=zn.match(e,"Base_application");n=Wn(s,{})}if(!(n.ruleName in this.rules))throw Mn(n.ruleName,this.name);const{formals:t}=this.rules[n.ruleName];if(t.length!==n.args.length){const{source:s}=this.rules[n.ruleName];throw jn(n.ruleName,t.length,n.args.length,s)}return n}_setUpMatchState(e){this._matchStateInitializer&&this._matchStateInitializer(e)}}k.ProtoBuiltInRules=new k("ProtoBuiltInRules",void 0,{any:{body:C,formals:[],description:"any character",primitive:!0},end:{body:P,formals:[],description:"end of input",primitive:!0},caseInsensitive:{body:new Ye(new F(0)),formals:["str"],primitive:!0},lower:{body:new L("Ll"),formals:[],description:"a lowercase letter",primitive:!0},upper:{body:new L("Lu"),formals:[],description:"an uppercase letter",primitive:!0},unicodeLtmo:{body:new L("Ltmo"),formals:[],description:"a Unicode character in Lt, Lm, or Lo",primitive:!0},spaces:{body:new se(new b("space")),formals:[]},space:{body:new E("\0"," "),formals:[],description:"a space"}});k.initApplicationParser=function(r,e){zn=r,Wn=e};class vn{constructor(e){this.name=e}sourceInterval(e,n){return this.source.subInterval(e,n-e)}ensureSuperGrammar(){return this.superGrammar||this.withSuperGrammar(this.name==="BuiltInRules"?k.ProtoBuiltInRules:k.BuiltInRules),this.superGrammar}ensureSuperGrammarRuleForOverriding(e,n){const t=this.ensureSuperGrammar().rules[e];if(!t)throw vr(e,this.superGrammar.name,n);return t}installOverriddenOrExtendedRule(e,n,t,s){const a=Fe(n);if(a.length>0)throw dn(e,a,s);const i=this.ensureSuperGrammar().rules[e],g=i.formals,o=g?g.length:0;if(n.length!==o)throw jn(e,o,n.length,s);return this.install(e,n,t,i.description,s)}install(e,n,t,s,a,i=!1){return this.rules[e]={body:t.introduceParams(n),formals:n,description:s,source:a,primitive:i},this}withSuperGrammar(e){if(this.superGrammar)throw new Error("the super grammar of a GrammarDecl cannot be set more than once");return this.superGrammar=e,this.rules=Object.create(e.rules),e.isBuiltIn()||(this.defaultStartRule=e.defaultStartRule),this}withDefaultStartRule(e){return this.defaultStartRule=e,this}withSource(e){return this.source=new Le(e).interval(0,e.length),this}build(){const e=new k(this.name,this.ensureSuperGrammar(),this.rules,this.defaultStartRule);e._matchStateInitializer=e.superGrammar._matchStateInitializer,e.supportsIncrementalParsing=e.superGrammar.supportsIncrementalParsing;const n=[];let t=!1;return Object.keys(e.rules).forEach(s=>{const{body:a}=e.rules[s];try{a.assertChoicesHaveUniformArity(s)}catch(i){n.push(i)}try{a.assertAllApplicationsAreValid(s,e)}catch(i){n.push(i),t=!0}}),t||Object.keys(e.rules).forEach(s=>{const{body:a}=e.rules[s];try{a.assertIteratedExprsAreNotNullable(e,[])}catch(i){n.push(i)}}),n.length>0&&Cr(n),this.source&&(e.source=this.source),e}define(e,n,t,s,a,i){if(this.ensureSuperGrammar(),this.superGrammar.rules[e])throw on(e,this.name,this.superGrammar.name,a);if(this.rules[e])throw on(e,this.name,this.name,a);const g=Fe(n);if(g.length>0)throw dn(e,g,a);return this.install(e,n,t,s,a,i)}override(e,n,t,s,a){return this.ensureSuperGrammarRuleForOverriding(e,a),this.installOverriddenOrExtendedRule(e,n,t,a),this}extend(e,n,t,s,a){if(!this.ensureSuperGrammar().rules[e])throw Ir(e,this.superGrammar.name,a);const g=new Ae(this.superGrammar,e,t);return g.source=t.source,this.installOverriddenOrExtendedRule(e,n,g,a),this}}class xe{constructor(){this.currentDecl=null,this.currentRuleName=null}newGrammar(e){return new vn(e)}grammar(e,n,t,s,a){const i=new vn(n);return t&&i.withSuperGrammar(t instanceof k?t:this.fromRecipe(t)),s&&i.withDefaultStartRule(s),e&&e.source&&i.withSource(e.source),this.currentDecl=i,Object.keys(a).forEach(g=>{this.currentRuleName=g;const o=a[g],l=o[0],c=o[1],d=o[2],u=o[3],p=this.fromRecipe(o[4]);let h;i.source&&c&&c.sourceInterval&&(h=i.source.subInterval(c.sourceInterval[0],c.sourceInterval[1]-c.sourceInterval[0])),i[l](g,u,p,d,h)}),this.currentRuleName=this.currentDecl=null,i.build()}terminal(e){return new N(e)}range(e,n){return new E(e,n)}param(e){return new F(e)}alt(...e){let n=[];for(let t of e)t instanceof f||(t=this.fromRecipe(t)),t instanceof S?n=n.concat(t.terms):n.push(t);return n.length===1?n[0]:new S(n)}seq(...e){let n=[];for(let t of e)t instanceof f||(t=this.fromRecipe(t)),t instanceof w?n=n.concat(t.factors):n.push(t);return n.length===1?n[0]:new w(n)}star(e){return e instanceof f||(e=this.fromRecipe(e)),new se(e)}plus(e){return e instanceof f||(e=this.fromRecipe(e)),new oe(e)}opt(e){return e instanceof f||(e=this.fromRecipe(e)),new Y(e)}not(e){return e instanceof f||(e=this.fromRecipe(e)),new B(e)}lookahead(e){return e instanceof f||(e=this.fromRecipe(e)),new M(e)}lex(e){return e instanceof f||(e=this.fromRecipe(e)),new G(e)}app(e,n){return n&&n.length>0&&(n=n.map(function(t){return t instanceof f?t:this.fromRecipe(t)},this)),new b(e,n)}splice(e,n){return new _e(this.currentDecl.superGrammar,this.currentRuleName,e.map(t=>this.fromRecipe(t)),n.map(t=>this.fromRecipe(t)))}fromRecipe(e){const n=e[0]==="grammar"?e.slice(1):e.slice(2),t=this[e[0]](...n),s=e[1];return s&&s.sourceInterval&&this.currentDecl&&t.withSource(this.currentDecl.sourceInterval(...s.sourceInterval)),t}}function Xe(r){return typeof r=="function"?r.call(new xe):(typeof r=="string"&&(r=JSON.parse(r)),new xe().fromRecipe(r))}const Qe=Xe(["grammar",{source:`BuiltInRules {

  alnum  (an alpha-numeric character)
    = letter
    | digit

  letter  (a letter)
    = lower
    | upper
    | unicodeLtmo

  digit  (a digit)
    = "0".."9"

  hexDigit  (a hexadecimal digit)
    = digit
    | "a".."f"
    | "A".."F"

  ListOf<elem, sep>
    = NonemptyListOf<elem, sep>
    | EmptyListOf<elem, sep>

  NonemptyListOf<elem, sep>
    = elem (sep elem)*

  EmptyListOf<elem, sep>
    = /* nothing */

  listOf<elem, sep>
    = nonemptyListOf<elem, sep>
    | emptyListOf<elem, sep>

  nonemptyListOf<elem, sep>
    = elem (sep elem)*

  emptyListOf<elem, sep>
    = /* nothing */

  // Allows a syntactic rule application within a lexical context.
  applySyntactic<app> = app
}`},"BuiltInRules",null,null,{alnum:["define",{sourceInterval:[18,78]},"an alpha-numeric character",[],["alt",{sourceInterval:[60,78]},["app",{sourceInterval:[60,66]},"letter",[]],["app",{sourceInterval:[73,78]},"digit",[]]]],letter:["define",{sourceInterval:[82,142]},"a letter",[],["alt",{sourceInterval:[107,142]},["app",{sourceInterval:[107,112]},"lower",[]],["app",{sourceInterval:[119,124]},"upper",[]],["app",{sourceInterval:[131,142]},"unicodeLtmo",[]]]],digit:["define",{sourceInterval:[146,177]},"a digit",[],["range",{sourceInterval:[169,177]},"0","9"]],hexDigit:["define",{sourceInterval:[181,254]},"a hexadecimal digit",[],["alt",{sourceInterval:[219,254]},["app",{sourceInterval:[219,224]},"digit",[]],["range",{sourceInterval:[231,239]},"a","f"],["range",{sourceInterval:[246,254]},"A","F"]]],ListOf:["define",{sourceInterval:[258,336]},null,["elem","sep"],["alt",{sourceInterval:[282,336]},["app",{sourceInterval:[282,307]},"NonemptyListOf",[["param",{sourceInterval:[297,301]},0],["param",{sourceInterval:[303,306]},1]]],["app",{sourceInterval:[314,336]},"EmptyListOf",[["param",{sourceInterval:[326,330]},0],["param",{sourceInterval:[332,335]},1]]]]],NonemptyListOf:["define",{sourceInterval:[340,388]},null,["elem","sep"],["seq",{sourceInterval:[372,388]},["param",{sourceInterval:[372,376]},0],["star",{sourceInterval:[377,388]},["seq",{sourceInterval:[378,386]},["param",{sourceInterval:[378,381]},1],["param",{sourceInterval:[382,386]},0]]]]],EmptyListOf:["define",{sourceInterval:[392,434]},null,["elem","sep"],["seq",{sourceInterval:[438,438]}]],listOf:["define",{sourceInterval:[438,516]},null,["elem","sep"],["alt",{sourceInterval:[462,516]},["app",{sourceInterval:[462,487]},"nonemptyListOf",[["param",{sourceInterval:[477,481]},0],["param",{sourceInterval:[483,486]},1]]],["app",{sourceInterval:[494,516]},"emptyListOf",[["param",{sourceInterval:[506,510]},0],["param",{sourceInterval:[512,515]},1]]]]],nonemptyListOf:["define",{sourceInterval:[520,568]},null,["elem","sep"],["seq",{sourceInterval:[552,568]},["param",{sourceInterval:[552,556]},0],["star",{sourceInterval:[557,568]},["seq",{sourceInterval:[558,566]},["param",{sourceInterval:[558,561]},1],["param",{sourceInterval:[562,566]},0]]]]],emptyListOf:["define",{sourceInterval:[572,682]},null,["elem","sep"],["seq",{sourceInterval:[685,685]}]],applySyntactic:["define",{sourceInterval:[685,710]},null,["app"],["param",{sourceInterval:[707,710]},0]]}]);k.BuiltInRules=Qe;Fr(k.BuiltInRules);const Ze=Xe(["grammar",{source:`Ohm {

  Grammars
    = Grammar*

  Grammar
    = ident SuperGrammar? "{" Rule* "}"

  SuperGrammar
    = "<:" ident

  Rule
    = ident Formals? ruleDescr? "="  RuleBody  -- define
    | ident Formals?            ":=" OverrideRuleBody  -- override
    | ident Formals?            "+=" RuleBody  -- extend

  RuleBody
    = "|"? NonemptyListOf<TopLevelTerm, "|">

  TopLevelTerm
    = Seq caseName  -- inline
    | Seq

  OverrideRuleBody
    = "|"? NonemptyListOf<OverrideTopLevelTerm, "|">

  OverrideTopLevelTerm
    = "..."  -- superSplice
    | TopLevelTerm

  Formals
    = "<" ListOf<ident, ","> ">"

  Params
    = "<" ListOf<Seq, ","> ">"

  Alt
    = NonemptyListOf<Seq, "|">

  Seq
    = Iter*

  Iter
    = Pred "*"  -- star
    | Pred "+"  -- plus
    | Pred "?"  -- opt
    | Pred

  Pred
    = "~" Lex  -- not
    | "&" Lex  -- lookahead
    | Lex

  Lex
    = "#" Base  -- lex
    | Base

  Base
    = ident Params? ~(ruleDescr? "=" | ":=" | "+=")  -- application
    | oneCharTerminal ".." oneCharTerminal           -- range
    | terminal                                       -- terminal
    | "(" Alt ")"                                    -- paren

  ruleDescr  (a rule description)
    = "(" ruleDescrText ")"

  ruleDescrText
    = (~")" any)*

  caseName
    = "--" (~"\\n" space)* name (~"\\n" space)* ("\\n" | &"}")

  name  (a name)
    = nameFirst nameRest*

  nameFirst
    = "_"
    | letter

  nameRest
    = "_"
    | alnum

  ident  (an identifier)
    = name

  terminal
    = "\\"" terminalChar* "\\""

  oneCharTerminal
    = "\\"" terminalChar "\\""

  terminalChar
    = escapeChar
      | ~"\\\\" ~"\\"" ~"\\n" "\\u{0}".."\\u{10FFFF}"

  escapeChar  (an escape sequence)
    = "\\\\\\\\"                                     -- backslash
    | "\\\\\\""                                     -- doubleQuote
    | "\\\\\\'"                                     -- singleQuote
    | "\\\\b"                                      -- backspace
    | "\\\\n"                                      -- lineFeed
    | "\\\\r"                                      -- carriageReturn
    | "\\\\t"                                      -- tab
    | "\\\\u{" hexDigit hexDigit? hexDigit?
             hexDigit? hexDigit? hexDigit? "}"   -- unicodeCodePoint
    | "\\\\u" hexDigit hexDigit hexDigit hexDigit  -- unicodeEscape
    | "\\\\x" hexDigit hexDigit                    -- hexEscape

  space
   += comment

  comment
    = "//" (~"\\n" any)* &("\\n" | end)  -- singleLine
    | "/*" (~"*/" any)* "*/"  -- multiLine

  tokens = token*

  token = caseName | comment | ident | operator | punctuation | terminal | any

  operator = "<:" | "=" | ":=" | "+=" | "*" | "+" | "?" | "~" | "&"

  punctuation = "<" | ">" | "," | "--"
}`},"Ohm",null,"Grammars",{Grammars:["define",{sourceInterval:[9,32]},null,[],["star",{sourceInterval:[24,32]},["app",{sourceInterval:[24,31]},"Grammar",[]]]],Grammar:["define",{sourceInterval:[36,83]},null,[],["seq",{sourceInterval:[50,83]},["app",{sourceInterval:[50,55]},"ident",[]],["opt",{sourceInterval:[56,69]},["app",{sourceInterval:[56,68]},"SuperGrammar",[]]],["terminal",{sourceInterval:[70,73]},"{"],["star",{sourceInterval:[74,79]},["app",{sourceInterval:[74,78]},"Rule",[]]],["terminal",{sourceInterval:[80,83]},"}"]]],SuperGrammar:["define",{sourceInterval:[87,116]},null,[],["seq",{sourceInterval:[106,116]},["terminal",{sourceInterval:[106,110]},"<:"],["app",{sourceInterval:[111,116]},"ident",[]]]],Rule_define:["define",{sourceInterval:[131,181]},null,[],["seq",{sourceInterval:[131,170]},["app",{sourceInterval:[131,136]},"ident",[]],["opt",{sourceInterval:[137,145]},["app",{sourceInterval:[137,144]},"Formals",[]]],["opt",{sourceInterval:[146,156]},["app",{sourceInterval:[146,155]},"ruleDescr",[]]],["terminal",{sourceInterval:[157,160]},"="],["app",{sourceInterval:[162,170]},"RuleBody",[]]]],Rule_override:["define",{sourceInterval:[188,248]},null,[],["seq",{sourceInterval:[188,235]},["app",{sourceInterval:[188,193]},"ident",[]],["opt",{sourceInterval:[194,202]},["app",{sourceInterval:[194,201]},"Formals",[]]],["terminal",{sourceInterval:[214,218]},":="],["app",{sourceInterval:[219,235]},"OverrideRuleBody",[]]]],Rule_extend:["define",{sourceInterval:[255,305]},null,[],["seq",{sourceInterval:[255,294]},["app",{sourceInterval:[255,260]},"ident",[]],["opt",{sourceInterval:[261,269]},["app",{sourceInterval:[261,268]},"Formals",[]]],["terminal",{sourceInterval:[281,285]},"+="],["app",{sourceInterval:[286,294]},"RuleBody",[]]]],Rule:["define",{sourceInterval:[120,305]},null,[],["alt",{sourceInterval:[131,305]},["app",{sourceInterval:[131,170]},"Rule_define",[]],["app",{sourceInterval:[188,235]},"Rule_override",[]],["app",{sourceInterval:[255,294]},"Rule_extend",[]]]],RuleBody:["define",{sourceInterval:[309,362]},null,[],["seq",{sourceInterval:[324,362]},["opt",{sourceInterval:[324,328]},["terminal",{sourceInterval:[324,327]},"|"]],["app",{sourceInterval:[329,362]},"NonemptyListOf",[["app",{sourceInterval:[344,356]},"TopLevelTerm",[]],["terminal",{sourceInterval:[358,361]},"|"]]]]],TopLevelTerm_inline:["define",{sourceInterval:[385,408]},null,[],["seq",{sourceInterval:[385,397]},["app",{sourceInterval:[385,388]},"Seq",[]],["app",{sourceInterval:[389,397]},"caseName",[]]]],TopLevelTerm:["define",{sourceInterval:[366,418]},null,[],["alt",{sourceInterval:[385,418]},["app",{sourceInterval:[385,397]},"TopLevelTerm_inline",[]],["app",{sourceInterval:[415,418]},"Seq",[]]]],OverrideRuleBody:["define",{sourceInterval:[422,491]},null,[],["seq",{sourceInterval:[445,491]},["opt",{sourceInterval:[445,449]},["terminal",{sourceInterval:[445,448]},"|"]],["app",{sourceInterval:[450,491]},"NonemptyListOf",[["app",{sourceInterval:[465,485]},"OverrideTopLevelTerm",[]],["terminal",{sourceInterval:[487,490]},"|"]]]]],OverrideTopLevelTerm_superSplice:["define",{sourceInterval:[522,543]},null,[],["terminal",{sourceInterval:[522,527]},"..."]],OverrideTopLevelTerm:["define",{sourceInterval:[495,562]},null,[],["alt",{sourceInterval:[522,562]},["app",{sourceInterval:[522,527]},"OverrideTopLevelTerm_superSplice",[]],["app",{sourceInterval:[550,562]},"TopLevelTerm",[]]]],Formals:["define",{sourceInterval:[566,606]},null,[],["seq",{sourceInterval:[580,606]},["terminal",{sourceInterval:[580,583]},"<"],["app",{sourceInterval:[584,602]},"ListOf",[["app",{sourceInterval:[591,596]},"ident",[]],["terminal",{sourceInterval:[598,601]},","]]],["terminal",{sourceInterval:[603,606]},">"]]],Params:["define",{sourceInterval:[610,647]},null,[],["seq",{sourceInterval:[623,647]},["terminal",{sourceInterval:[623,626]},"<"],["app",{sourceInterval:[627,643]},"ListOf",[["app",{sourceInterval:[634,637]},"Seq",[]],["terminal",{sourceInterval:[639,642]},","]]],["terminal",{sourceInterval:[644,647]},">"]]],Alt:["define",{sourceInterval:[651,685]},null,[],["app",{sourceInterval:[661,685]},"NonemptyListOf",[["app",{sourceInterval:[676,679]},"Seq",[]],["terminal",{sourceInterval:[681,684]},"|"]]]],Seq:["define",{sourceInterval:[689,704]},null,[],["star",{sourceInterval:[699,704]},["app",{sourceInterval:[699,703]},"Iter",[]]]],Iter_star:["define",{sourceInterval:[719,736]},null,[],["seq",{sourceInterval:[719,727]},["app",{sourceInterval:[719,723]},"Pred",[]],["terminal",{sourceInterval:[724,727]},"*"]]],Iter_plus:["define",{sourceInterval:[743,760]},null,[],["seq",{sourceInterval:[743,751]},["app",{sourceInterval:[743,747]},"Pred",[]],["terminal",{sourceInterval:[748,751]},"+"]]],Iter_opt:["define",{sourceInterval:[767,783]},null,[],["seq",{sourceInterval:[767,775]},["app",{sourceInterval:[767,771]},"Pred",[]],["terminal",{sourceInterval:[772,775]},"?"]]],Iter:["define",{sourceInterval:[708,794]},null,[],["alt",{sourceInterval:[719,794]},["app",{sourceInterval:[719,727]},"Iter_star",[]],["app",{sourceInterval:[743,751]},"Iter_plus",[]],["app",{sourceInterval:[767,775]},"Iter_opt",[]],["app",{sourceInterval:[790,794]},"Pred",[]]]],Pred_not:["define",{sourceInterval:[809,824]},null,[],["seq",{sourceInterval:[809,816]},["terminal",{sourceInterval:[809,812]},"~"],["app",{sourceInterval:[813,816]},"Lex",[]]]],Pred_lookahead:["define",{sourceInterval:[831,852]},null,[],["seq",{sourceInterval:[831,838]},["terminal",{sourceInterval:[831,834]},"&"],["app",{sourceInterval:[835,838]},"Lex",[]]]],Pred:["define",{sourceInterval:[798,862]},null,[],["alt",{sourceInterval:[809,862]},["app",{sourceInterval:[809,816]},"Pred_not",[]],["app",{sourceInterval:[831,838]},"Pred_lookahead",[]],["app",{sourceInterval:[859,862]},"Lex",[]]]],Lex_lex:["define",{sourceInterval:[876,892]},null,[],["seq",{sourceInterval:[876,884]},["terminal",{sourceInterval:[876,879]},"#"],["app",{sourceInterval:[880,884]},"Base",[]]]],Lex:["define",{sourceInterval:[866,903]},null,[],["alt",{sourceInterval:[876,903]},["app",{sourceInterval:[876,884]},"Lex_lex",[]],["app",{sourceInterval:[899,903]},"Base",[]]]],Base_application:["define",{sourceInterval:[918,979]},null,[],["seq",{sourceInterval:[918,963]},["app",{sourceInterval:[918,923]},"ident",[]],["opt",{sourceInterval:[924,931]},["app",{sourceInterval:[924,930]},"Params",[]]],["not",{sourceInterval:[932,963]},["alt",{sourceInterval:[934,962]},["seq",{sourceInterval:[934,948]},["opt",{sourceInterval:[934,944]},["app",{sourceInterval:[934,943]},"ruleDescr",[]]],["terminal",{sourceInterval:[945,948]},"="]],["terminal",{sourceInterval:[951,955]},":="],["terminal",{sourceInterval:[958,962]},"+="]]]]],Base_range:["define",{sourceInterval:[986,1041]},null,[],["seq",{sourceInterval:[986,1022]},["app",{sourceInterval:[986,1001]},"oneCharTerminal",[]],["terminal",{sourceInterval:[1002,1006]},".."],["app",{sourceInterval:[1007,1022]},"oneCharTerminal",[]]]],Base_terminal:["define",{sourceInterval:[1048,1106]},null,[],["app",{sourceInterval:[1048,1056]},"terminal",[]]],Base_paren:["define",{sourceInterval:[1113,1168]},null,[],["seq",{sourceInterval:[1113,1124]},["terminal",{sourceInterval:[1113,1116]},"("],["app",{sourceInterval:[1117,1120]},"Alt",[]],["terminal",{sourceInterval:[1121,1124]},")"]]],Base:["define",{sourceInterval:[907,1168]},null,[],["alt",{sourceInterval:[918,1168]},["app",{sourceInterval:[918,963]},"Base_application",[]],["app",{sourceInterval:[986,1022]},"Base_range",[]],["app",{sourceInterval:[1048,1056]},"Base_terminal",[]],["app",{sourceInterval:[1113,1124]},"Base_paren",[]]]],ruleDescr:["define",{sourceInterval:[1172,1231]},"a rule description",[],["seq",{sourceInterval:[1210,1231]},["terminal",{sourceInterval:[1210,1213]},"("],["app",{sourceInterval:[1214,1227]},"ruleDescrText",[]],["terminal",{sourceInterval:[1228,1231]},")"]]],ruleDescrText:["define",{sourceInterval:[1235,1266]},null,[],["star",{sourceInterval:[1255,1266]},["seq",{sourceInterval:[1256,1264]},["not",{sourceInterval:[1256,1260]},["terminal",{sourceInterval:[1257,1260]},")"]],["app",{sourceInterval:[1261,1264]},"any",[]]]]],caseName:["define",{sourceInterval:[1270,1338]},null,[],["seq",{sourceInterval:[1285,1338]},["terminal",{sourceInterval:[1285,1289]},"--"],["star",{sourceInterval:[1290,1304]},["seq",{sourceInterval:[1291,1302]},["not",{sourceInterval:[1291,1296]},["terminal",{sourceInterval:[1292,1296]},`
`]],["app",{sourceInterval:[1297,1302]},"space",[]]]],["app",{sourceInterval:[1305,1309]},"name",[]],["star",{sourceInterval:[1310,1324]},["seq",{sourceInterval:[1311,1322]},["not",{sourceInterval:[1311,1316]},["terminal",{sourceInterval:[1312,1316]},`
`]],["app",{sourceInterval:[1317,1322]},"space",[]]]],["alt",{sourceInterval:[1326,1337]},["terminal",{sourceInterval:[1326,1330]},`
`],["lookahead",{sourceInterval:[1333,1337]},["terminal",{sourceInterval:[1334,1337]},"}"]]]]],name:["define",{sourceInterval:[1342,1382]},"a name",[],["seq",{sourceInterval:[1363,1382]},["app",{sourceInterval:[1363,1372]},"nameFirst",[]],["star",{sourceInterval:[1373,1382]},["app",{sourceInterval:[1373,1381]},"nameRest",[]]]]],nameFirst:["define",{sourceInterval:[1386,1418]},null,[],["alt",{sourceInterval:[1402,1418]},["terminal",{sourceInterval:[1402,1405]},"_"],["app",{sourceInterval:[1412,1418]},"letter",[]]]],nameRest:["define",{sourceInterval:[1422,1452]},null,[],["alt",{sourceInterval:[1437,1452]},["terminal",{sourceInterval:[1437,1440]},"_"],["app",{sourceInterval:[1447,1452]},"alnum",[]]]],ident:["define",{sourceInterval:[1456,1489]},"an identifier",[],["app",{sourceInterval:[1485,1489]},"name",[]]],terminal:["define",{sourceInterval:[1493,1531]},null,[],["seq",{sourceInterval:[1508,1531]},["terminal",{sourceInterval:[1508,1512]},'"'],["star",{sourceInterval:[1513,1526]},["app",{sourceInterval:[1513,1525]},"terminalChar",[]]],["terminal",{sourceInterval:[1527,1531]},'"']]],oneCharTerminal:["define",{sourceInterval:[1535,1579]},null,[],["seq",{sourceInterval:[1557,1579]},["terminal",{sourceInterval:[1557,1561]},'"'],["app",{sourceInterval:[1562,1574]},"terminalChar",[]],["terminal",{sourceInterval:[1575,1579]},'"']]],terminalChar:["define",{sourceInterval:[1583,1660]},null,[],["alt",{sourceInterval:[1602,1660]},["app",{sourceInterval:[1602,1612]},"escapeChar",[]],["seq",{sourceInterval:[1621,1660]},["not",{sourceInterval:[1621,1626]},["terminal",{sourceInterval:[1622,1626]},"\\"]],["not",{sourceInterval:[1627,1632]},["terminal",{sourceInterval:[1628,1632]},'"']],["not",{sourceInterval:[1633,1638]},["terminal",{sourceInterval:[1634,1638]},`
`]],["range",{sourceInterval:[1639,1660]},"\0","􏿿"]]]],escapeChar_backslash:["define",{sourceInterval:[1703,1758]},null,[],["terminal",{sourceInterval:[1703,1709]},"\\\\"]],escapeChar_doubleQuote:["define",{sourceInterval:[1765,1822]},null,[],["terminal",{sourceInterval:[1765,1771]},'\\"']],escapeChar_singleQuote:["define",{sourceInterval:[1829,1886]},null,[],["terminal",{sourceInterval:[1829,1835]},"\\'"]],escapeChar_backspace:["define",{sourceInterval:[1893,1948]},null,[],["terminal",{sourceInterval:[1893,1898]},"\\b"]],escapeChar_lineFeed:["define",{sourceInterval:[1955,2009]},null,[],["terminal",{sourceInterval:[1955,1960]},"\\n"]],escapeChar_carriageReturn:["define",{sourceInterval:[2016,2076]},null,[],["terminal",{sourceInterval:[2016,2021]},"\\r"]],escapeChar_tab:["define",{sourceInterval:[2083,2132]},null,[],["terminal",{sourceInterval:[2083,2088]},"\\t"]],escapeChar_unicodeCodePoint:["define",{sourceInterval:[2139,2243]},null,[],["seq",{sourceInterval:[2139,2221]},["terminal",{sourceInterval:[2139,2145]},"\\u{"],["app",{sourceInterval:[2146,2154]},"hexDigit",[]],["opt",{sourceInterval:[2155,2164]},["app",{sourceInterval:[2155,2163]},"hexDigit",[]]],["opt",{sourceInterval:[2165,2174]},["app",{sourceInterval:[2165,2173]},"hexDigit",[]]],["opt",{sourceInterval:[2188,2197]},["app",{sourceInterval:[2188,2196]},"hexDigit",[]]],["opt",{sourceInterval:[2198,2207]},["app",{sourceInterval:[2198,2206]},"hexDigit",[]]],["opt",{sourceInterval:[2208,2217]},["app",{sourceInterval:[2208,2216]},"hexDigit",[]]],["terminal",{sourceInterval:[2218,2221]},"}"]]],escapeChar_unicodeEscape:["define",{sourceInterval:[2250,2309]},null,[],["seq",{sourceInterval:[2250,2291]},["terminal",{sourceInterval:[2250,2255]},"\\u"],["app",{sourceInterval:[2256,2264]},"hexDigit",[]],["app",{sourceInterval:[2265,2273]},"hexDigit",[]],["app",{sourceInterval:[2274,2282]},"hexDigit",[]],["app",{sourceInterval:[2283,2291]},"hexDigit",[]]]],escapeChar_hexEscape:["define",{sourceInterval:[2316,2371]},null,[],["seq",{sourceInterval:[2316,2339]},["terminal",{sourceInterval:[2316,2321]},"\\x"],["app",{sourceInterval:[2322,2330]},"hexDigit",[]],["app",{sourceInterval:[2331,2339]},"hexDigit",[]]]],escapeChar:["define",{sourceInterval:[1664,2371]},"an escape sequence",[],["alt",{sourceInterval:[1703,2371]},["app",{sourceInterval:[1703,1709]},"escapeChar_backslash",[]],["app",{sourceInterval:[1765,1771]},"escapeChar_doubleQuote",[]],["app",{sourceInterval:[1829,1835]},"escapeChar_singleQuote",[]],["app",{sourceInterval:[1893,1898]},"escapeChar_backspace",[]],["app",{sourceInterval:[1955,1960]},"escapeChar_lineFeed",[]],["app",{sourceInterval:[2016,2021]},"escapeChar_carriageReturn",[]],["app",{sourceInterval:[2083,2088]},"escapeChar_tab",[]],["app",{sourceInterval:[2139,2221]},"escapeChar_unicodeCodePoint",[]],["app",{sourceInterval:[2250,2291]},"escapeChar_unicodeEscape",[]],["app",{sourceInterval:[2316,2339]},"escapeChar_hexEscape",[]]]],space:["extend",{sourceInterval:[2375,2394]},null,[],["app",{sourceInterval:[2387,2394]},"comment",[]]],comment_singleLine:["define",{sourceInterval:[2412,2458]},null,[],["seq",{sourceInterval:[2412,2443]},["terminal",{sourceInterval:[2412,2416]},"//"],["star",{sourceInterval:[2417,2429]},["seq",{sourceInterval:[2418,2427]},["not",{sourceInterval:[2418,2423]},["terminal",{sourceInterval:[2419,2423]},`
`]],["app",{sourceInterval:[2424,2427]},"any",[]]]],["lookahead",{sourceInterval:[2430,2443]},["alt",{sourceInterval:[2432,2442]},["terminal",{sourceInterval:[2432,2436]},`
`],["app",{sourceInterval:[2439,2442]},"end",[]]]]]],comment_multiLine:["define",{sourceInterval:[2465,2501]},null,[],["seq",{sourceInterval:[2465,2487]},["terminal",{sourceInterval:[2465,2469]},"/*"],["star",{sourceInterval:[2470,2482]},["seq",{sourceInterval:[2471,2480]},["not",{sourceInterval:[2471,2476]},["terminal",{sourceInterval:[2472,2476]},"*/"]],["app",{sourceInterval:[2477,2480]},"any",[]]]],["terminal",{sourceInterval:[2483,2487]},"*/"]]],comment:["define",{sourceInterval:[2398,2501]},null,[],["alt",{sourceInterval:[2412,2501]},["app",{sourceInterval:[2412,2443]},"comment_singleLine",[]],["app",{sourceInterval:[2465,2487]},"comment_multiLine",[]]]],tokens:["define",{sourceInterval:[2505,2520]},null,[],["star",{sourceInterval:[2514,2520]},["app",{sourceInterval:[2514,2519]},"token",[]]]],token:["define",{sourceInterval:[2524,2600]},null,[],["alt",{sourceInterval:[2532,2600]},["app",{sourceInterval:[2532,2540]},"caseName",[]],["app",{sourceInterval:[2543,2550]},"comment",[]],["app",{sourceInterval:[2553,2558]},"ident",[]],["app",{sourceInterval:[2561,2569]},"operator",[]],["app",{sourceInterval:[2572,2583]},"punctuation",[]],["app",{sourceInterval:[2586,2594]},"terminal",[]],["app",{sourceInterval:[2597,2600]},"any",[]]]],operator:["define",{sourceInterval:[2604,2669]},null,[],["alt",{sourceInterval:[2615,2669]},["terminal",{sourceInterval:[2615,2619]},"<:"],["terminal",{sourceInterval:[2622,2625]},"="],["terminal",{sourceInterval:[2628,2632]},":="],["terminal",{sourceInterval:[2635,2639]},"+="],["terminal",{sourceInterval:[2642,2645]},"*"],["terminal",{sourceInterval:[2648,2651]},"+"],["terminal",{sourceInterval:[2654,2657]},"?"],["terminal",{sourceInterval:[2660,2663]},"~"],["terminal",{sourceInterval:[2666,2669]},"&"]]],punctuation:["define",{sourceInterval:[2673,2709]},null,[],["alt",{sourceInterval:[2687,2709]},["terminal",{sourceInterval:[2687,2690]},"<"],["terminal",{sourceInterval:[2693,2696]},">"],["terminal",{sourceInterval:[2699,2702]},","],["terminal",{sourceInterval:[2705,2709]},"--"]]]}]),Ce=Object.create(f.prototype);function In(r,e){for(const n in r)if(n===e)return!0;return!1}function Jn(r,e,n){const t=new xe;let s,a,i,g=!1;return(n||Ze).createSemantics().addOperation("visit",{Grammars(c){return c.children.map(d=>d.visit())},Grammar(c,d,u,p,h){const m=c.visit();s=t.newGrammar(m),d.child(0)&&d.child(0).visit(),p.children.map(ee=>ee.visit());const v=s.build();if(v.source=this.source.trimmed(),In(e,m))throw br(v);return e[m]=v,v},SuperGrammar(c,d){const u=d.visit();if(u==="null")s.withSuperGrammar(null);else{if(!e||!In(e,u))throw hr(u,e,d.source);s.withSuperGrammar(e[u])}},Rule_define(c,d,u,p,h){a=c.visit(),i=d.children.map(de=>de.visit())[0]||[],!s.defaultStartRule&&s.ensureSuperGrammar()!==k.ProtoBuiltInRules&&s.withDefaultStartRule(a);const m=h.visit(),v=u.children.map(de=>de.visit())[0],ee=this.source.trimmed();return s.define(a,i,m,v,ee)},Rule_override(c,d,u,p){a=c.visit(),i=d.children.map(v=>v.visit())[0]||[];const h=this.source.trimmed();s.ensureSuperGrammarRuleForOverriding(a,h),g=!0;const m=p.visit();return g=!1,s.override(a,i,m,null,h)},Rule_extend(c,d,u,p){a=c.visit(),i=d.children.map(v=>v.visit())[0]||[];const h=p.visit(),m=this.source.trimmed();return s.extend(a,i,h,null,m)},RuleBody(c,d){return t.alt(...d.visit()).withSource(this.source)},OverrideRuleBody(c,d){const u=d.visit(),p=u.indexOf(Ce);if(p>=0){const h=u.slice(0,p),m=u.slice(p+1);return m.forEach(v=>{if(v===Ce)throw _r(v)}),new _e(s.superGrammar,a,h,m).withSource(this.source)}else return t.alt(...u).withSource(this.source)},Formals(c,d,u){return d.visit()},Params(c,d,u){return d.visit()},Alt(c){return t.alt(...c.visit()).withSource(this.source)},TopLevelTerm_inline(c,d){const u=a+"_"+d.visit(),p=c.visit(),h=this.source.trimmed(),m=!(s.superGrammar&&s.superGrammar.rules[u]);g&&!m?s.override(u,i,p,null,h):s.define(u,i,p,null,h);const v=i.map(ee=>t.app(ee));return t.app(u,v).withSource(p.source)},OverrideTopLevelTerm_superSplice(c){return Ce},Seq(c){return t.seq(...c.children.map(d=>d.visit())).withSource(this.source)},Iter_star(c,d){return t.star(c.visit()).withSource(this.source)},Iter_plus(c,d){return t.plus(c.visit()).withSource(this.source)},Iter_opt(c,d){return t.opt(c.visit()).withSource(this.source)},Pred_not(c,d){return t.not(d.visit()).withSource(this.source)},Pred_lookahead(c,d){return t.lookahead(d.visit()).withSource(this.source)},Lex_lex(c,d){return t.lex(d.visit()).withSource(this.source)},Base_application(c,d){const u=d.children.map(p=>p.visit())[0]||[];return t.app(c.visit(),u).withSource(this.source)},Base_range(c,d,u){return t.range(c.visit(),u.visit()).withSource(this.source)},Base_terminal(c){return t.terminal(c.visit()).withSource(this.source)},Base_paren(c,d,u){return d.visit()},ruleDescr(c,d,u){return d.visit()},ruleDescrText(c){return this.sourceString.trim()},caseName(c,d,u,p,h){return u.visit()},name(c,d){return this.sourceString},nameFirst(c){},nameRest(c){},terminal(c,d,u){return d.children.map(p=>p.visit()).join("")},oneCharTerminal(c,d,u){return d.visit()},escapeChar(c){try{return Dn(this.sourceString)}catch(d){throw d instanceof RangeError&&d.message.startsWith("Invalid code point ")?Lr(c):d}},NonemptyListOf(c,d,u){return[c.visit()].concat(u.children.map(p=>p.visit()))},EmptyListOf(){return[]},_terminal(){return this.sourceString}})(r).visit()}const Xr=Xe(["grammar",{source:`OperationsAndAttributes {

  AttributeSignature =
    name

  OperationSignature =
    name Formals?

  Formals
    = "(" ListOf<name, ","> ")"

  name  (a name)
    = nameFirst nameRest*

  nameFirst
    = "_"
    | letter

  nameRest
    = "_"
    | alnum

}`},"OperationsAndAttributes",null,"AttributeSignature",{AttributeSignature:["define",{sourceInterval:[29,58]},null,[],["app",{sourceInterval:[54,58]},"name",[]]],OperationSignature:["define",{sourceInterval:[62,100]},null,[],["seq",{sourceInterval:[87,100]},["app",{sourceInterval:[87,91]},"name",[]],["opt",{sourceInterval:[92,100]},["app",{sourceInterval:[92,99]},"Formals",[]]]]],Formals:["define",{sourceInterval:[104,143]},null,[],["seq",{sourceInterval:[118,143]},["terminal",{sourceInterval:[118,121]},"("],["app",{sourceInterval:[122,139]},"ListOf",[["app",{sourceInterval:[129,133]},"name",[]],["terminal",{sourceInterval:[135,138]},","]]],["terminal",{sourceInterval:[140,143]},")"]]],name:["define",{sourceInterval:[147,187]},"a name",[],["seq",{sourceInterval:[168,187]},["app",{sourceInterval:[168,177]},"nameFirst",[]],["star",{sourceInterval:[178,187]},["app",{sourceInterval:[178,186]},"nameRest",[]]]]],nameFirst:["define",{sourceInterval:[191,223]},null,[],["alt",{sourceInterval:[207,223]},["terminal",{sourceInterval:[207,210]},"_"],["app",{sourceInterval:[217,223]},"letter",[]]]],nameRest:["define",{sourceInterval:[227,257]},null,[],["alt",{sourceInterval:[242,257]},["terminal",{sourceInterval:[242,245]},"_"],["app",{sourceInterval:[252,257]},"alnum",[]]]]}]);Qr(k.BuiltInRules);Zr(Xr);function Qr(r){const e={empty(){return this.iteration()},nonEmpty(n,t,s){return this.iteration([n].concat(s.children))}};j.BuiltInSemantics=j.createSemantics(r,null).addOperation("asIteration",{emptyListOf:e.empty,nonemptyListOf:e.nonEmpty,EmptyListOf:e.empty,NonemptyListOf:e.nonEmpty})}function Zr(r){j.prototypeGrammarSemantics=r.createSemantics().addOperation("parse",{AttributeSignature(e){return{name:e.parse(),formals:[]}},OperationSignature(e,n){return{name:e.parse(),formals:n.children.map(t=>t.parse())[0]||[]}},Formals(e,n,t){return n.asIteration().children.map(s=>s.parse())},name(e,n){return this.sourceString}}),j.prototypeGrammar=r}function et(r){let e=0;const n=[0],t=()=>n[n.length-1],s={},a=/( *).*(?:$|\r?\n|\r)/g;let i;for(;(i=a.exec(r))!=null;){const[g,o]=i;if(g.length===0)break;const l=o.length,c=t(),d=e+l;if(l>c)n.push(l),s[d]=1;else if(l<c){const u=n.length;for(;t()!==l;)n.pop();s[d]=-1*(u-n.length)}e+=g.length}return n.length>1&&(s[e]=1-n.length),s}const Yn="an indented block",Xn="a dedent",yn=1114112;class nt extends Le{constructor(e){super(e.input),this.state=e}_indentationAt(e){return this.state.userData[e]||0}atEnd(){return super.atEnd()&&this._indentationAt(this.pos)===0}next(){if(this._indentationAt(this.pos)!==0){this.examinedLength=Math.max(this.examinedLength,this.pos);return}return super.next()}nextCharCode(){return this._indentationAt(this.pos)!==0?(this.examinedLength=Math.max(this.examinedLength,this.pos),yn):super.nextCharCode()}nextCodePoint(){return this._indentationAt(this.pos)!==0?(this.examinedLength=Math.max(this.examinedLength,this.pos),yn):super.nextCodePoint()}}class Rn extends f{constructor(e=!0){super(),this.isIndent=e}allowsSkippingPrecedingSpace(){return!0}eval(e){const{inputStream:n}=e,t=e.userData;e.doNotMemoize=!0;const s=n.pos,a=this.isIndent?1:-1;return(t[s]||0)*a>0?(e.userData=Object.create(t),e.userData[s]-=a,e.pushBinding(new ae(0),s),!0):(e.processFailure(s,this),!1)}getArity(){return 1}_assertAllApplicationsAreValid(e,n){}_isNullable(e,n){return!1}assertChoicesHaveUniformArity(e){}assertIteratedExprsAreNotNullable(e){}introduceParams(e){return this}substituteParams(e){return this}toString(){return this.isIndent?"indent":"dedent"}toDisplayString(){return this.toString()}toFailure(e){const n=this.isIndent?Yn:Xn;return new V(this,n,"description")}}const rt=new b("indent"),tt=new b("dedent"),st=new _e(Qe,"any",[rt,tt],[]),at=new xe().newGrammar("IndentationSensitive").withSuperGrammar(Qe).define("indent",[],new Rn(!0),Yn,void 0,!0).define("dedent",[],new Rn(!1),Xn,void 0,!0).extend("any",[],st,"any character",void 0).build();Object.assign(at,{_matchStateInitializer(r){r.userData=et(r.input),r.inputStream=new nt(r)},supportsIncrementalParsing:!1});k.initApplicationParser(Ze,Jn);function it(r,e){const n=Ze.match(r,"Grammars");if(n.failed())throw fr(n);return Jn(n,e)}function ct(r,e){const n=ot(r),t=Object.keys(n);if(t.length===0)throw new Error("Missing grammar definition");if(t.length>1){const a=n[t[1]].source;throw new Error(ze(a.sourceString,a.startIdx)+"Found more than one grammar definition -- use ohm.grammars() instead.")}return n[t[0]]}function ot(r,e){const n=Object.create({});return it(r,n),n}class re{constructor(e="",n="",t=1){K(this,"duration");K(this,"dotted");K(this,"multiplier");K(this,"sfths",0);switch(this.duration=e,this.dotted=n,this.multiplier=t,this.duration){case"\\breve":this.sfths=128;break;case"1":this.sfths=64;break;case"2":this.sfths=32;break;case"4":this.sfths=16;break;case"8":this.sfths=8;break;case"16":this.sfths=4;break;case"32":this.sfths=2;break;case"64":this.sfths=1;break;default:this.sfths=0;break}n!=null&&(this.sfths=this.sfths*1.5**this.dotted.length),t!=null&&(this.sfths*=t)}toString(){var e="";return e+=this.duration,e+=this.dotted,this.multiplier!=1&&(e+="*"+this.multiplier),e}static getDValue(e,n=void 0){const t=[];n!=null&&(t.push(...re.getDValue(n)),e-=n);const s=(e>>>0).toString(2).split("").reverse();for(var a=0;a<s.length;a++)s[a]=="1"&&t.push(2**(6-a));return t.map(i=>i.toString())}static split(e,n){const t=e-n;return[re.getDValue(n),Math.floor(t/128),re.getDValue(t%128)]}}class en{constructor(){K(this,"duration",new re)}toString(){return"huh"}}class dt extends en{constructor(){super()}toString(){return"|"}}class je extends en{constructor(n,t,s,a,i){super();K(this,"notename");K(this,"accidental");K(this,"octave");K(this,"slur");this.notename=n,this.accidental=t,this.octave=s,this.duration=a,this.slur=i,a!=null&&(this.length=a.sfths)}toString(n=!0){var t="";return t+=this.notename,this.accidental!=null&&(t+=this.accidental),this.octave!=null&&(t+=this.octave),n&&(t+=this.duration),this.slur!=null&&(t+=this.slur),t}}class Qn extends en{constructor(n,t){super();K(this,"restname");this.restname=n,this.duration=t,this.length=t.sfths}toString(n=!0){var t="";return t+=this.restname,n&&(t+=this.duration.toString()),t}}const gt=`Lilypond { 

	File = (Clause)*
    Clause = RelativeClause | Version
	
    Version = "\\\\version" "\\"" (digit | ".")* "\\""
    
    RelativeClause = (variable "=")? "\\\\relative" note? "{" Music "}"
    
    Music = ( Component | command) *

    comment = "%" (~"\\n" any)* ("\\n" | end)
    space += comment
    
    Component = note --note
    		| repeatedNote -- repeatedNote
		    | rest --rest
		    | barline -- barline
            
    command = "\\\\" (~"\\n" any)* ("\\n" | end)
    
    barline = "|"
    
	note = noteName accidental? octave? durationScaled? slur?
	noteName = "a" | "b" | "c" | "d" | "e" | "f" | "g"
    
    repeatedNote = durationScaled slur?
    
    accidental = "is" -- sharp 
    			| "es" -- flat
    
    rest = restName durationScaled?
    restName = "r" -- rest 
    		| "R" -- wholeBarRest
    
    octave = octaveUp | octaveDown
    octaveUp = "'"+
    octaveDown = ","+
    
    fraction = #(digit+ ("/" digit+)?)
    
    durationScaled = duration ("*" fraction)?
    duration = ("\\\\breve" | "64" | "32" | "16" | "8" | "4" | "2" | "1") "."*
    
    slur = "~"
    
    variable = letter+
}`,ce={};var Ge={},Ve,qe;async function lt(){Ve=ct(gt),qe=Ve.createSemantics();var r,e;function n(t){var s=t.parse()[0];return s==null?s=e:e=s,s}qe.addOperation("parse",{Version(t,s,a,i){a.sourceString},RelativeClause(t,s,a,i,g,o,l){const c=t.parse();return i.parse(),c[0]!=null&&(Ge[c[0]]=o.parse()),Ge[c]},Component(t){return t.parse()},command(t,s,a){s.sourceString},barline(t){return new dt},repeatedNote(t,s){const a=t.parse(),i=s.sourceString.length==0?void 0:s.sourceString;return new je(r.notename,r.accidental,"",a,i)},note(t,s,a,i,g){const o=t.sourceString,l=s.sourceString.length==0?void 0:s.sourceString,c=a.sourceString.length==0?void 0:a.sourceString;var d=n(i);const u=g.sourceString.length==0?void 0:g.sourceString;return r=new je(o,l,c,d,u),r},rest(t,s){const a=t.sourceString;var i=n(s);return new Qn(a,i)},duration(t,s){const a=t.sourceString,i=s.sourceString;return new re(a,i,1)},durationScaled(t,s,a){const i=t.parse(),g=a.parse()[0];return new re(i.duration,i.dotted,g)},fraction(t,s,a){return parseInt(t.sourceString)},variable(t){return t.sourceString},_iter(...t){return t.map(s=>s.parse())}})}var ue=[];async function ut(r){const e=Ve.match(r);e.succeeded()||console.error("Bad Lilypond "+e.message),qe(e).parse();const n=["I","II","III","IV","V","VI","VII","VIII"],t=["Soprano","Alto","Tenor","Baritone","Bass"];for(var s=0;s<8;s++){ue[s]=[];for(var a=0;a<5;a++){ue[s][a]=[];var i="notes"+n[s]+t[a],g=Ge[i],o=void 0,l=1;const d=128;for(var c of g)c instanceof je?(o==null&&(o=l),ce[l]==null&&(ce[l]=[]),ce[l].push({c:s,p:a,n:c}),l+=c.duration.sfths/d):c instanceof Qn&&(o!=null&&(ue[s][a].push({from:o,to:l}),o=void 0),l+=c.duration.sfths/d);o!=null&&(ue[s][a].push({from:o,to:l}),o=void 0)}}}const pt=`\\version "2.24.3"

% ------------
% Choir 1
% ------------

notesISoprano = \\relative c {
  r1 d''1~ 
  d2 d d d 
  a c c e2~ 
  e4 d d1 c2 
  b2. a4 g2 d 
  g a2. a4 d,2 
  r2 d'2. c4 c2~
  c2  f,2 c'4. b8 a4 g 
  f2 f'2. e4 d2~ 
  d4 a2 d d, a'4~ 
  a4 e4 r4 g c2 g' 
  f4. e8 d4 c b2 g 
  d'1 r1 
  r2 d d4 d2 a4 
  | %15
  a2 r4 f c' e2 c4 
  e2 r4 a, a e'2 c4 
  f2 f4. e8 d4 a a2~ 
  a2 d,2 a'2. a4 
  a2 r2 r4 g2 b4 
  d a2 d g,4 r4 d'4~ d4 e8 fis g2. d4 d2 
  r1 d,2 a' 
  r4 d b2. g4 d'2 
  g, c1 a2 
  a1 r1 
  | %26
  R\\breve*14
  r2 d2 b b 
  e,1 r2 b' 
  e r4 e,2 e4 e2~ 
  e4 e4 e2 r4 d g2~
  g4 b2 g4 r4 d'2 g4 
  g1 r1
  |
  R\\breve*19 
  | r1 d1 
  | % 66
  e1. e2 
  e1 r2 e 
  e d c2. c4 
  b1 r2 g2~
  g4 g4. e8 e4 r4 c2 g'4~
  g8 e8  e2 c'4. c8 c4 r4 e4~ 
  | % 72
  e4 e4. f8 g4 r4 c, f, c'4~
  c8 a8  a2 g8 f g2 r4 g4~
  g4 g4 d'2 r2 d 
  d4. d8 d4 d r2 g,2~
  g2 f2 r4 g d'2 
  | R\\breve*4
  r2 c2 f2. f4 
  | e d d2 c4 a2 g8 f 
  e2  r4 a4~ a8  b8 c d e4 a,4~
  a4 d4  d2 r1 
  | % 85
  r2 e2 d1 
  d2  d4 g2 f8 e d4. c8 
  b1 r1
  | R\\breve*3 
  r2 c2. c4 e2 
  f  e r1 
  | % 93
  r2 d2 e d 
  r2 d e d 
  c b r1
  | R\\breve*5
  | r1 r2 r4 g'4 
  f2 e r2 r4 g4 
  f f e2 d r1
  r2 a4 d2 cis4 
  d2 r2 r2 e2 
  b4 d g, c b2  g 
  r2 r4 g4 g4. a8  b c d4 
  g,1 r2 e'2~
  e2 e2 e1~ 
  e1 r1
  | R\\breve*6
  | r1 r2 d2 
  d d4 d g2. f4 
  e2 d c b 
  a d2~ d4 c4 b g 
  | % 121
  a1 r1 
  b1. b2 
  b r4 g2 b4 b2 
  R\\breve
  |  r2 c2 c c4 c f1 c 
  r4 a2 f4. d8 d'2. 
  d2 r2 r4 bes2. 
  | f'2 f,4 a2 d, g4 
  g1 r1 
  r2 d'2. b4 b2 
  b4 d2 b4 r2 r4 c4~
  c8 g8 g4. d8 d4 r2 r4 g4 
  e e'2 e4 e c c2 
  r2 r4 g4 d'2. g4 
  g2 r4  g2 d4 d2 
  d\\breve~ 
  d\\breve~
  d1
}

notesIAlto = \\relative c {
  g''1. g2 
  g g d f 
  f a1 g2 
  f1 e 
  d2. c4 b g b2~ 
  b2 a2 a2. b8 c 
  | %7
  d1 r2 g 
  e f4 d e1
  f2 a2. g4 f e 
  | % 10
  d2 a r4 a'2 a4 
  a a e g2 g4 g2~
  g2 fis2 g b 
  | % 13
  b b2. a4 g2 
  r2 r4 a2 a4 a2 
  a4 d,2 a'4 a c2 g4 
  g2 r2 e e4 a4~
  a4 d,4 f2 f4. g8 a4 f4~
  f4 d4 d2. a4 d a 
  | %19
  a2 r2 r2 d2 
  a d r2 d4 g4~
  g4 d4 d2. d4 a2 
  | %22
  r1 a4 d4. e8 f4 
  r4 d2 g,4 g'2. g4 
  g1 r1
  | %25
  | R\\breve*15
  
  | %40
  r2 d2 d4 g g2 
  r4 g2 e4 g c, r4 g'4~
  | g8 e8 e4. f8 g4 r2 r4 c,4 
  e g2 g4 r4 d d g4~ 
  g4 g g2 r2 r4 d4~
  | d8 b8 b2 g4 d'1
  | R\\breve*19
  
  r1 d1 
  c2. d4 e f g2 
  r2 c, g' g 
  a2. a4 g1~
  | g2 g2. a4 b2 
  c1. g2 
  g r4 g g2 g4 c4~
  | c8 c8 c4 c, e f a4. a8 f4 
  r2 e4 e2 e4 r2 
  | g4. g8 g2 r2 b 
  | % 75
  b4. b8 b4 b r4 g g2 
  | % 76
  | R\\breve*5
  
  | % 81
  | r2 a2 a a 
  b b c1 
  c2 a a1 
  a r1
  r2 c2 a1 
  b2 g1 fis2 
  g1 r1
  | R\\breve*3
  
  | % 91
  r2 a2. a4 a2 
  a a r1
  | r2 g2 g g 
  r2 g g g4 g4~
  | g4 g,2 d'4 r4 e g2 
  | R\\breve*4
  
  | r1 r4 b4 c g 
  r4 d g c, r4 g'2 c4 
  f, a g c, c2 r4 c 
  c c e2 a, r2
  | r1 a'4 a4. g8 e4 
  r4 a e a,2 a'4 a e 
  g2 g r4 g g2  
  g2 r2 r4 g4 g2~
  | g4 c4 c2 r2 a2~ 
  a2 a2 a1~
  a1 r1
  | R\\breve*6
  | r1 d,2 d2 
  d4 d g2. f4 e2 
  r2 d g, d'4. e8 
  f4 g a2 d,1~
  d1  r1 
  d1. d2 
  | d\\breve 
  R\\breve
  | % 125
  a'2 a a4 a c2~
  | c2 a4 f f1 
  r2 f2. bes,4 bes'2 
  bes r4 bes,2. bes2 
  | r4 d a2 a r2 
  c4 g'2 c,4. a8 a'4 a2 
  r1 r2 g2 
  g4 g4. a8 b4 r2 r4 e,4
  | e2 b2 r2 c2~
  c4 e4 c g' g1 
  r2 b,2. b4 b2 
  | b4 d2 d4 r2 g2~
  | g2 d2 d1~
  | d\\breve~
  d1
}

notesITenor = \\relative c {
  \\clef "treble_8"

  R\\breve*4
  r1 d'1~
  | % 5
  d2 d2 d d
  a a c e2~
  e4 d4 d1 cis2
  d a r2 d4 d
  f1. d2
  e2. d4 c2 b
  a1 g
  r2 g4 g d'2 d,
  d1 r2 d
  d4 a'2 f4 a a e2
  r4 e f a2 e4 e'2

  | % 17
  r2 a, d4 f4. f8 e4
  d2 r4 d,4 d a'2 f4
  r4 c' c4. d8 e2 r2
  r2 d2 d4 g2 g,4
  d'4. c8 b2 g4 d'2 a4
  r1 d4 f4. e8 d4~
  d4 d4. c8 b4 b4. a8 g2
  g1 r1
  R\\breve*15

  | % 40 
  r2 b2 b4 b b2 
  r2 e, e r2 
  g4 g g2 r2 e 
  e' e b4 d g, b4~
  b b b2 r2 r4 d,4 
  g4 b g d'2 b4 d2
  | R\\breve*19

  | % 65
  r1 g,1
  g2 e e1
  r2 c' c c

  | % 67
  c4 c a2 r1
  r1 d1
  e2. e4 e1
  g2 e c g'2~
  | g4 c,4 c2 r2 r4 c4
  | c2 c4 c4. g8 g4 r2
  d'4. g,8 g2 r2 g'
  | g g4 g4. f8 e4. d8 c4
  | R\\breve*5

  % 81
  | r2 c2 a a4 d4~
  | d8 c8 b4. a8 g4 r4 c a e'4~
  | e2 a,2 r4 a8 b c d e4
  f d d2 r1
  | r2 c2 f4. e8 d4. c8
  b2 r2 a4 d2 a4
  r4 d b g g2 r2
  | R\\breve*3

  % 89
  | r2 e'2. e4 e2
  r4 a,2 e'4 e2 r2
  r2 d2 g d
  r2 d g d4 g,4~
  | g4 g'4 g2 r1
  | % 96
  R\\breve*4

  % 100
  | r1 r4 d4 c2
  b r4 e d d c2
  a4 f c'2 r2 r4 e4
  f f g2 d r2
  r1 r4 f4 e2
  | d r2 r4 f4 e e
  d2 c r4 b e2
  d4 c2 b4 e2 d
  c1 r2 cis2~
  cis2 cis2 cis1
  | R\\breve*8

  % 118
  | r2 d2 e c4 c
  g'2. f4 e2 d2
  | d4 c4 b a g2 r4 d4~
  | d4 fis4 fis2 r1
  g2. b2 g d'4~
  | d4 g,4 b2 b1
  r1 r2 c2
  | % 125
  c4 c c f2 c4 r4 c
  a f c'2 r4 a4 a a
  a4 c2. f,4 f'2.
  f2 r4 d2 g,4 g2
  r4 d2. d1
  | % 130
  r4*5 d'2.
  d2 r1 d2
  d d4 d g,2 g
  r2 g' g g4 g
  c,2. e4 e1
  r2 r4 d2 d4. c8 b4
  r4 g2. g1
  | % 137
  r2 b b1~
  | b\\breve~
  b1
}

notesIBaritone = \\relative c {
  \\clef bass

  R\\breve*4 
  g'1. g2 
  g f d f~ 
  f a1 g2~
  g2 f2 e1 
  d a'2 d, 
  a'1 r2 d, 
  a'4 c2 c,4. d8 e c d2 
  r4 d a' d4. 
  c8 b2 g4 
  b2. d2 g,4 r4 d' 
  b2 a1 d,2 
  d'2. d,4 e2 c 
  r2 a' c1 
  r2 f,2. f2 a4~ 
  a d,4 a' d2 c8 b a2 
  r2 c4 c,2 g'4~
  g d4 
  r4 d' 
  d2. d,4 g d 
  d1 r1 
  g2 c r4 f, a2 
  r4 d,2 d'4 d1
  | %24
  R\\breve*16
  % \\break
  | %40 
  r2 g,2 g4 b b2 
  r4 g 
  c, g'2 c4 r2 
  c2. g4 g1 
  r2 g g1 
  r2 g 
  g4. a8 b4. c8 
  d2. b4 b1 
  | %46
  R\\breve*19
  % \\break
  | r1 g1 
  g1. g2 
  g1 r1
  R\\breve 
  r1 g1 
  g2 g  c,4 e2 g4 
  g c2 c4 c1 
  r2 c,4 c2 c4 r4 a'4~
  a4 a4 a2 r1 
  b4. b8 b2 r2 g 
  | % 75
  g2. g4 g2 g 
  d'1 g,2 r2
  | R\\breve*4 
  | % 81
  r2 a2 d, f 
  g g a1 
  g2 f e1 
  | d r1
  r2 a'2 a d, 
  d r1 d2 
  d1. g2 
  g r2 r1
  R\\breve*2 
  r2 c2. c4 a2 
  a a r1
  r2g2 g g 
  r2 g g g 
  g g r1 
  R\\breve*4
  % \\break
  | % 100
  r1 r2 e4 g4~
  g4 d4 r2 d4 g2 c,4 
  f2 c r2 r4 c4 
  f f c2 f r1 
  r2 d4 a'4. e8 a4 
  a2 r2 r4 a4 c c 
  b2 e,4 g2 d4 r4 g~ 
  | g e2 g4. f8 e4 r4 g4~
  g4 c,4 g'2 r2 e2~
  e2 e2 e1~
  e1 r1
  R\\breve*7
  % 118
  | r1 r2 g2 
  g d4 d g1 a b 
  a r1 
  g2. f8 e d2 b 
  b\\breve 
  | % 124
  r1 r2 c2 
  c4 f f a2 f4 f2 
  c'1 a2 c 
  r2 f, f4 bes bes d4~ 
  d4 d bes4. a8 g4 d2 g4 
  r2 r4 f4 f2 r4 g4~
  g8 c,8 e4 
  r2 r4 d4 d2 
  r2 d' b b4 b 
  g2 d r1 
  r2 d4 g2 e e4 
  e4. f8 g2 r4 c2 c4 
  r4 b2 g4 g2 r4 g4~
  | g4 d'4. g,8 b4. c8 d4 d, g4~ 
  g8 a8 b2 g4 g1~ 
  g\\breve~
  g1
}

notesIBass = \\relative c {
  \\clef bass

  R\\breve*5
  r2 d1 d2 
  d d a c2~ 
  c2 d2 a a 
  d1 f1~ 
  f2 d2 f1 
  e2 c4 g' e4. f8 g2 
  r2 d d g~ 
  g2 d d2. g,4 
  g2 r4 d' a'2. a4 
  d,1 r1
  r2 d2 e a2~
  a4 a4 d,1 a'2 
  | a a2. a4 d,2 
  r2 g e r4 d 
  d a'2 d,4 r4 g g2~
  g4 g,4 d' g, d'2 r2 
  |  r1 r4 a'2 d,4~
  d4 g2 f8 e d2 g, 
  | r2  c4 c c1
  | R\\breve*15

  % 40
  r2 d2 d g,4 g'4~
  g4 c,4 e2. g4. g8 
  d4 r4 g2 e4. f8 g2 c,4~
  c4 g'4 g2 r4 g2 d4~ 
  | d4 g,4 d'1 g2 
  g\\breve
  R\\breve*23

  | % 69
  | r1 g2 g2~
  g4 c,4 c e e2 c 
  r4 g'2 e c g'4~
  g4 g4 g2 a4 a2 a4 
  e a, c1 c2 
  d1 r2 g 
  b2. g4 g c, g'2~ 
  | g4 f4 d2 r1
  | R\\breve*4 

  r1 r2 d2 
  g, b a2. a4 
  c2 f,4 f a1 
  d r1
  r2 a2 d1 
  g,2 r4 d' f2 f4. e8 
  d4 g, g2 r1
   R\\breve*12
   | % 100
   |  r1 r4 g'4 g2 
   g r4 g g g e2 
  d r2 r1
  | R\\breve
  r1 r4 d4 a'2 
  d, r4 r2 a'4 a a 
  d,2 e4 c g'2 c, 
  g4 c2 g4 c2 g 
  c1 r2 e2~
  e2 a2 a,2. b4 
  c a e'2 r1
  | R\\breve*11

  % 122
  g1. d2 
  g\\breve 
  R\\breve
  | % 125
  c,2 c c2. f4
  f2 c2 r2 f 
  f a4 a bes2 f 
  | r2 d bes d 
  r2 f d bes 
  r2 g' f4 a2 d,4 
  d1 r1
  r2 g2 g g4 g 
  g4. a8 b2 g r2
  r2 c,2 g' e 
  r2 g g, g' 
  g2. f8 e d1~ 
  | % 136
  d\\breve~
  d\\breve~
  d1
}

% ------------
% Choir 2
% ------------

notesIISoprano = \\relative c {
  R\\breve*7
  | r2 a''1 a2 
  a a d, f 
  f a1 f2 
  c' c2. g4 b g 
  a1 r2 d 
  d4 b2 g d'4. c8 b4~
  b4 g4 a2 r4 f'2 d4 
  f4. f8 f2 r4 c g c 
  c2 r2 e2. a,4~
  a4 d2 d4 d2 d2
  d2 d2. f4 d2 
  r4 e2 e4 g2 r4 d 
  d4. e8 f4 d r4 d g, b4~
  b4 b4. c8 d4 r4 d, d2 
  r4 g2 c4 f, a r4 d4~
  | d8 b b2 g d'4 r4 g,4~
  g4 e e2 r4 a c f4~
  f4 c4 c2 r1
  | R\\breve*14
  
  % 40
  r2 g'2 g g 
  g2 r2 g, g4 g4~
  g4 c4 c2 r2 g4 e4~
  e4 e'4. f8 g2 d g,4 
  b d r4 d, g d r4 g4~
  g4 d'4 b d d1 
  R\\breve*19
  
  % 65
  | r1 b1 
  c1. c2 
  c1 g2 c2~
  c2 d2 e2. c4 
  d1 d2 g2~
  g2 g2 g1 
  r2 g e c 
  e4 g2 c,4 c2 r2
  r4 a4 e'2 e4 e4. e8 e4 
  r4 b8 b g2 r2 g 
  d4. d8 d4 g r4 c,4. d8 e4 
  R\\breve*5
  
  % 81
  | r2 r4 a2 d d4 
  b4 g d'4. e8 f2 e2~
  e4 d4 d1 cis2 
  d1 r1
  r2 a2 f4 a2 d,4~
  | d4 g b4. c8 d2 r4 d4~
  | d4 g2 f8 e d2 r2
  R\\breve*3
  
  % 91
  r2 e2. e4 c2 
  a4 f c'2 r1
  r2 b4 d c4. a8 b2 
  r2 b4 d c4. a8 b4 g 
  g2 r2 r1
  | R\\breve*4

  %100
  | r1 b4 g2 g4 
  r4 b g2 r2 r4 g4 
  d'2 g,4 c c2 r4 c 
  c4 c c2 f, r2
  r1 r4 d'4 c8 b a g 
  f4 d r2 r2 a'2 
  d4 b c2 d r2
  r4 g4 g2 g r2
  r1 r2 e2 
  cis1 cis 
  R\\breve*6

  %116
  | r1 r2 a2 
  a f4 g a2 d, 
  r2 g g g4 g 
  c2 d e g 
  f d r2 d 
  d1 r1 
  d1. d2 
  d\\breve 
  R\\breve*2
  
  % 126
  | r2 c2 c4 c c f4~
  f4 c4 c2 r4 f,4 f bes4 
  bes4 d2. d2 r2
  r4 d2 d4 d d g2~
  g2 c,2 r4 f4. e8 d c 
  b1 r2 d 
  b2 b4 b e,2 e 
  r2 b' e r4 e,4~
  e4 e e e e2 e 
  r4 d g2. b2 g4 
  r4 d'2 g4 g1 
  r4 g,2 d'4 d2 b 
  b\\breve~
  b1
}

notesIIAlto = \\relative c {
  R\\breve*3
  r1 g''1~
  g2 g g g 
  d f f a2~
  a4 g f2. e2 c4 
  c4. b8 a1 c2 
  a2 d r4 a'2 a4 
  a2 a4 d,2 f e8 d 
  c2. b8 a g1 
  r1 d'2. b4~
  b4 g d'4. c8 b1 
  | % 14
  r4 d d a'2 f4 f2~
  f4 f d2 r2 c4 c
  g'2 d a' r2
  r2 a2 a d,2~
  d4 a a2 r2 a'2~
  a4 g8 f g2 c, r2 
  f a r2 d4 b4~
  b8 a g2 d4 d2 r4 a' 
  e g2 e4 a2 d, 
  r4 b d g2 d4 d2 
  R\\breve*16

  % 40
  | r2 b'2 b b 
  c1 r2 b4 g4~
  g2 e r4 g g2~
  g4 c2 g4 r4 g,2 g4 
  g2 r4 g' b b2 b4 
  b\\breve 
  | R\\breve*19

  %65 
  | r1 g1 g1. g2 
  g2 g e c 
  f1 e 
  d r1
  r2 e2 e2. e4 
  e2 r2 r2 c'2 
  c g r4 c4. c8 c4 
  r4 c, c2 c c4. g8 
  g1 r2 g 
  d'4 b b d r4 g, c2 
  R\\breve*5

  % 81
  | r2 e2 f4. g8 a2 
  g4 g4. f8 d4 r4 a'2 e4~
  e8 f g4 r4 a c4. b8 a4. g8 
  f4. g8 a4 d, r1
  r2 a'2 a4. g8 fis2 
  g r2 d a'2
  r4 b4 g2. f8 e d2 
  R\\breve*3

  % 91
  r2 e4. e8 a4 c4. b8 a g 
  f4 d e2 r1
  r2 g4. f8 e4 c d2 
  r2 g4. f8 e4 c d2 
  r2 d a r2
  R\\breve*4
  
  % 100
  | r1 d4 g2 c,4 
  r2 e4 g2 d4 r4 g 
  d4 a' c2 f,4 a r4 e 
  a4 a e2 a r2
  r1 r2 a4 a4~
  a8 g f4 r4 e a d, r4 a' 
  g4. f8 e2 r2 c4 g4~
  g4 g'4 c, g'2 c,4 r2
  r1 r2 a2~
  a4 cis2 a4 a1 
  R\\breve*7
  
  % 117
  | a'2 a a4 a d2~
  d4 c4 b a g c, g'2~
  g4 a b2 g r4 d4~
  d4 a2 d g,4 r4 d'4~
  d4 a'4. d,8 d4 r1 
  g1. g2 
  g\\breve 
  R\\breve

  % 125
  | r1 a2 a4 a 
  a4 c2 a4 a1 
  r1 d2. d,4 
  d2 r2 r2 d2~
  d2 f4 f4. g8 a4 bes g 
  r4 g2 c4. b8 a g f2 
  r4 d d2 r4 d d d 
  d4 g2 d4 r4 c g2~
  g4 g'4 g2 r1 
  g4 c4. g8 g4. e8 e c g'2 
  r2 g4 d'4. b8 b g g2 
  r4 d2 e8 f g2. b4~
  b4 g4 b4. a8 g1 
  g\\breve~
  g1
}

notesIITenor = \\relative c {
  \\clef "treble_8"
  
  R\\breve*8
  r2 d'1 d2 
  d d a a 
  c e1 d2~
  d4 c a2 b4 g2 d'4 
  d2 b r2 g'2~
  g4 d2 a d c8 b 
  a2 d r2 g 
  e4 c f2 r2 e 
  a, f4 d a'2 d 
  r2 f2. f4 f2 
  r2 e4 c2 g d'4~
  d4 d a2 d4. c8 b4. a8 
  g1 r2 d' 
  g,1 d'4. c8 a4. c8 
  | % 23
  b\\breve 
  R\\breve*16 
  
  % 40
  r2 d2 d b 
  e1 r2 d4 g, 
  g2 r4 e' e2. e,4
  e4. f8 g4 e r4 g d d'4~
  d4 b4 r4 g g g'2 g4~
  g8 d g4 g2 r1
  R\\breve*19
  
  % 65
  | r1 g,1 
  c1. c2 
  c1 r2 c a 
  f c'2. c4 
  g1 r1
  r2 c2 c c 
  g r4 e'2 g g4 
  r4 e4. e8 e4 r2 r4 c4 
  a4 e r4 e'2 e4 e2 
  r4 d4. d8 d4 r2 d 
  d4. d8 d4 b r4 e,2 e'4 
  r4 a, a2 r1
  R\\breve*4
  
  % 81
  | r2 a2 d4. d8 d4 a 
  r4 d2 g4. f8 e d e4 c 
  r4 c d8 e f d e2 e,4 a4~
  a8 d, f4. g8 a4 r1
  r2 c2 d1~
  d2 g,2 r4 f a2
  r4 g4 d2 r1
  R\\breve*3
  
  % 91
  r2 a'2. a4 c2 
  d c r1
  r2 b2 c b 
  r2 b c4 c b2 
  e, r2 r1
  R\\breve*4
  
  % 100
  | r1 r4 b'4 g4. a8 
  b8 c d4 r4 g,8 a b c d4 e e 
  f d e2 r2 r4 c4 
  c4 f, c'2 a r2
  r1 r4 a4 c4. b8 
  a4 d r2 r2 r4 c4 
  g4 b g4. a8 b c d4 r4 g, 
  b4 g g2 r2 b4. a8 
  g8 e g4. f8 e4 r2 e'2~
  e2 e2 e1~
  e1 r1
  R\\breve*5
  
  % 116
  | r1 r2 a,2 
  c d4 e f2. e4 
  d2 g,2. a8 b c2~
  c2 g2. a4 b c 
  d e fis2 g1 
  fis r1 
  d1. d2 
  d1 r2 d 
  d4 d d f2 f, c'4~
  c4 a r4 c2 a4 a2 
  r4 a2 a4. bes8 c4 f,2 
  r2 r4 f2 f4 f f 
  f2 r2 d bes'2 
  f4. g8 a2 r1 
  c4 c4. d8 e c d2 r4 d4~ 
  d4 b b g4 g2 g 
  r1 r2 c2~
  c4 g2 d'4 r4 e2 c4~
  c4 g g2 r2 g' 
  g4. g,8 b4. c8 d1 
  b r1 
  b\\breve 
  b\\breve~
  b1
}

notesIIBaritone = \\relative c {
  \\clef bass

  R\\breve*7
  r1 r2 a'2~
  a2 a2 a a 
  d, f f a2~
  a2 g g2. d4 
  f2. e4 d1~
  d1 r2 d'2~
  d4 d4 d2 d4 a2 d4~
  d4 a a2 r2 c2~
  c2 f,2 a r4 a4~
  a f4 a2. d4 a d, 
  a'2 f4 d r4 d'2 d4 
  c a r4 c4. d8 e4 b d 
  r4 d,2 d d'4 d2 
  r4 d g, d' b2 r2
  r1 r4 a2 d4~
  | d4 d, r4 d2 g4 d g4~
  g4 c,4 g' g f1~
  f1 r1
  R\\breve*14
  
  %40 
  | r2 g2 g4 d'2 g,4 
  r4 g2 c,4 e4. f8 g2 
  r2 c1 c2 
  c2 r2 d1 
  b2 b4. c8 d2 r4 d,4~
  d4 e8 f g2 d1 
  | R\\breve*19
  
  % 65
  r1 g1 
  e2 c c1~
  c1 r1 
  R\\breve*2
  r2 c2 c4 c c2 
  r2 e4 e2 e4 g4. g8 
  g2 c4 c2 a c4~
  c8 c c4 r2 c,4 c2 c4 
  r2 g'8 g g4 r2 g 
  g4 g d d r4 g c, g' 
  r4 d f2 r1
  R\\breve*4
  
  % 81
  | r2 a4 a4. g8 f4. e8 d4 
  r4 d2 d4 a' c4. b8 a4 
  r4 e a d c a4. b8 c4 
  f, a d,2 r1
  r2 e4 a2 d,4 a'2 
  g g4 d'2 a4 d2 
  d1 r1
  R\\breve*3
  
  % 91
  r2 a2. a4 a2 
  d, a' r1
  r2 g2 c, g' 
  r2 g c, g'4 g4~
  g4 e g2 r1
  R\\breve*4
  
  % 100
  | r1 r4 d4 e2 
  b2 r2 b' g4 e 
  a4 d, g2 r2 r4 g4 
  a4 a g e f2 c 
  r1 r4 d4 e2 
  f r2 r4 f4 c c 
  g'2 g r4 g2 e4 
  g2 r2 r4 g4. d8 d4 
  r4 g c, g' r2 a 
  e2 cis cis1 
  R\\breve*6
  
  % 116
  | r1 r2 a'2 
  a a4 a d2. c4 
  b a b2 c c,4 d 
  e4 c g'2 r2 d2~
  d1 d1~
  d1 r1 
  d1. d2 
  d1 r2 d 
  d4 f f a2 d,4 a'2 
  r2 f c'1 
  f,2 r2 r4 c' c c 
  c f,4. g8 a4 r4 d,2 f4~
  f4 d4 d2 r2 r4 d4 
  a'4 f f2 r2 g 
  g r2 r4 d'4. d,8 d4~
  d4 d r2 r4 d'2 b4
  b4 g4 g2 g1 
  r1 g2 g 
  r4 c,2 c'4. g8 g4 r4 g4~
  g4 b b b b4. c8 d2 
  r2 g,4 d'2 g,4 b4. c8 
  d\\breve~
  d\\breve~
  d1
}

notesIIBass = \\relative c {
  \\clef bass

  R\\breve*8
  r1 d1~
  d2 d d d 
  a c1 g2 
  d' d g,1~
  g\\breve
  r2 d' f f4. g8 
  a2 d, r2 e 
  e a1 e2 
  f1. d2 
  r4 d2 a'4 d,2 r4 a'4~
  a4 e e2. g4 g2 
  | r1 r2 g,2 
  g g2. g4 d'2 
  r1 r2 d2~
  d2 g, d'1 
  R\\breve*16

  % 40
  | r1 r2 g2 
  g g g4. a8 b2 
  g r2 r2 c,2 
  g' e r2 g 
  g,2 g' g2. f8 e 
  d1 r4 g,2 d'4 
  d2 r2 r1
  R\\breve*22
  
  % 69
  | r1 d2. g4~
  g4 g e2 r4 g2 e4~
  e4 c2 g' c,4 e2~
  e4 e g2 r2 c,4 c4~
  c4 e4 a e e2 r4 g 
  g4. a8 b2 r2 b, 
  d4 d g2. g4 e2 
  d r2 r1
  R\\breve*5
  
  % 81
  | r2 g2 c,2. c4 
  e2 f4 a4. a8 e4 a2 
  a1 r1 
  r2 e2 f2. e4 
  d2 r4 d4. e8 f4. g8 a4 
  r4 d, g2 g r2
  R\\breve*12
  
  % 100
  r1 r4 g,4 c2 
  g r4 c g g c2 
  d r2 r1
  R\\breve
  r1 r4 d4 a2 
  d r2 r4 d4 a a 
  b g c2 g c 
  d4 e c d e4. c8 g'2 
  e1 r2 a2~
  a2 e2 a1~
  a1 r1
  R\\breve*6
  
  % 117
  | r2 d,2 d d4 d 
  g2. f4 e2. d4 
  c2 b c g 
  d'2. c4 b4. a8 g2 
  d'1 r1 
  g,1. g2 
  g\\breve 
  r2 d'1 f2 
  f4 f a2 f a2~
  a4 a,4 a2 r2 a 
  c2 c bes d 
  r4 d2 g f8 e d2 
  r2 r4 f2. d2 
  r4 g2 e4 f4. d8 a'2 
  r4 d, d2 r2 g, 
  d' d4 d c2 c 
  g' g4. f8 e2 c 
  e1 c 
  r2 d g b2~
  b2 g2 b b4. a8 
  g\\breve
  g\\breve~
  g1
}

% ------------
% Choir 3
% ------------

notesIIISoprano = \\relative c {
  R\\breve*10
  r1 r2 d''2~
  d2 d2 d d 
  g, b b d2~
  d4 d4 a2 r2 d 
  d2 d2. c4 c2 
  r2 f, c'4. b8 a4. g8 
  f2 f'1 f2 
  f f4. e8 d2 d2~
  d4 c4 c2. b8 a b4 g 
  a1 b2. g4 
  b4. c8 d2 d4. e8 f2 
  g e f d 
  d1. b2 
  e, g r4 c, f2~
  f4 f f2 r1
  R\\breve*9
  
  % 35
  r1 r2 c'2 
  c2 c a4 d2 a4 
  r4 c4. d8 e4 f4. e8 d4 c 
  b1 r1
  R\\breve
  
  % 40
  | r1 r2 g2 
  g2. c4 c2 r2 
  c2 e e2. e4 
  e1 r2 b 
  b2. d2 b4 b2~
  b4 g4 d'2 b1 
  R\\breve*16
  
  % 62
  | r1 r2 g'2~
  g2 d2 f e 
  d1 r2 d 
  d\\breve
  R\\breve*3

  % 69
  | r1 d1 
  g,2. g4 g2 g' 
  e c g'2. g4 
  c,1 r2 a4 a~
  a4 a a2 e4 e'4. g8 g4 
  r4 g4 g2 r2 d 
  
  % 75
  | g,4 g g2 
  g4 c2 c4 
  R\\breve*8
  
  % 84
  | r2 d2 b1 
  c r1 
  b4 g2 f8 e d2 r2 
  g4 b4. c8 d4 r1
  r2 d2. d4 d2 
  g, d' r1
  r2 e2. e4 e2 
  a, e' r1
  R\\breve*4
  
  % 96
  | r2 e2 a, e' 
  r2 e4 a,2 a4 c e 
  r4 a,2 e'4 r4 a,8 b c d e4 
  r4 a, a2 r1
  R\\breve*4
  
  % 104
  r4 f'4 e2 d r2
  r4 f4 e e d2 c 
  r4 b e2 d c 
  b4 e2 d c b4 
  c1 r2 cis 
  a2 e' e1~
  e1 r1
  R\\breve*2
  
  % 113
  | r1 r2 e2 
  e e4 e g2. f4 
  e2. d4 c2 c 
  d e4 e f2. e8 d 
  c4 a2 d c4 a2 
  b1 r1
  R\\breve*3
  
  % 122
  | d1. g2 
  g\\breve
  R\\breve*2
  r1 r2 c,2 
  c4 c c f2 d4 f2~
  f4 bes,4 bes2 r2 d2~
  d4 d,2 a'4 a2 r4 bes4~
  bes8 a16 bes a8 g g2 r2 r4 a4 
  | d2 r2 g, b 
  b4 b d2 r4 g, g2 
  r2 g g1 
  r1 r2 g'2 
  g4 g g g2 f8 e d2~
  | d2 g, d'1 
  d\\breve~
  d\\breve~
  d1
}

notesIIIAlto = \\relative c {
  R\\breve*11

  % 12
  | r1 r2 g''2~
  g2 g g g 
  d f f a2~
  a4 g4 f2. e4 e4. d8 
  c4. b8 a2 e' a,2~
  a2 d r2 d 
  a4 a' a4. g8 f4 d2 a'4~
  a c2 g4 g2 g 
  f4. e8 d2. b4 d4. c8 
  b4. a8 g2 r2 a4 a 
  e'2. e4 a,2 d2~
  d4 g,2 b4 g g'2 d4 
  r4 g e c2 a4 a2~
  a4 c2 a4 d2 r2
  R\\breve*9
  
  %35
  | r1 r2 e2 
  e c f a2~
  a4 g4 g1 fis2 
  g1 r1
  R\\breve
  
  % 40
  | r2 g2 g4 d d2 
  r4 e4. f8 g4 g2 r2
  r4 c,2 c'4 c2 r4 c,4
  c4 e4. d8 c4 r4 g' g2 
  d g, r2 d'2~
  d2 d g1 
  R\\breve*16

  % 62
  | r2 c1 g2 
  b b a r4 a4~
  a4 d4. c8 b4 a d4. c8 a4 
  b\\breve
  R\\breve*3
  
  % 69
  | r1 g2. g4~
  g8 c, e c c4 g g2 r2 
  e'4 e2 e4 r2 c2~
  c4 c c2 r1
  r2 c'4 c2 g4 c4. c8 
  b1 r2 r4 g4 
  g4 d d d r4 e g2 
  R\\breve*8
  
  % 84
  | r2 a2 d,2 g2~
  g4 c,4 c2 r1 
  g4 b4. c8 d4 d2 r2 
  g,4 d'2 b4 b1 
  r2 d2. d4 g2 
  g2 g r1
  r2 e2. e4 a,2 
  r4 a2 e'4 e2 r2
  R\\breve*4
  
  % 96
  | r2 e4 a4. d,8 a'2 e4 
  r2 r4 a,2 d4 r4 c 
  f4. g8 a2 r4 f c'2 
  f, r2 r1
  R\\breve*4
  
  % 104
  | f4 a4. g8 e4 a2 r2
  r4 a4 a a a2 a 
  r2 r4 e4 g2 g 
  r2 r4 g4 e c' b g 
  g2 r2 r2 e2~
  e2 e2 e1~
  e1 r1 
  R\\breve*3
  
  % 114
  | r2a2. g4 a b 
  c2 b a1 
  r2 e a a4 a 
  a2 a2. e4 fis2 
  g1 r1
  R\\breve*3
  
  % 122
  | b1. b2 
  b r4 b,2 d4 d2 
  R\\breve*2
  
  % 126
  | r1 f2 f4 f 
  f4 a2. d,1 
  r2 g g1 
  r2 d' d1 
  r1 d1 
  r4 g,2 g4 g g g2 
  g r2 r4 g2 e4 
  g4 c, r4 g'4. e8 e4. f8 g4 
  r2 r4 c,4 e g2 g4 
  r4 d2 g4 g2 g 
  r2 r4 d4. b8 b2 g4 
  r4 d' b d d1~
  d\\breve~
  d1
}

notesIIITenor = \\relative c {
  \\clef "treble_8"
  
  R\\breve*11

  % 12
  | r2 d'1 d2 
  d d g, b 
  b d2. d4 a2 
  r2 a c e~
  e2 d1 cis2 
  d4 d2 c8 b a2 f 
  r2 a4 a d2. d,4 
  a'2 e4 g c2 b 
  a1 g 
  r4 g2 b4. c8 d4 r4 d 
  e2 g f4 d4. c8 a4 
  d2. d4 b1 
  r4 g g c2 f,4 a c4~
  c4 a a2 r1
  R\\breve*9
  
  % 35
  r1 r2 e'2 
  e e a,1 
  e'1 a,2 d2~
  d4 g, d'2 r1
  R\\breve
  
  % 40
  r2 d2 d4 d d2 
  r2 c c4 g2 d'4 
  r4 e2 c g4 g2 
  r2 g' g4. g,8 b4. c8 
  d2. d4 b1~
  b\\breve
  R\\breve*12
  
  % 58
  | r2 g'1 c,2 
  e2 e d4. c8 b4 g 
  a4. b8 c4 g2 d'4 b d 
  r4 d2 cis4 d2. d4 
  d2 c1. 
  b2 d2. a4 c2 
  f4. e8 d2. c8 b a2 
  d\\breve 
  R\\breve*4
  
  % 70
  | g,2. c4 c g2 c4 
  c g g2. g4 c2 
  r4 e, e e r4 c'2 c4 
  c2 r2 r2 g2~
  g4 g g2 r2 g4 d' 
  d4 d4. g,8 g4 r4 c e2 
  R\\breve*8
  
  % 84
  | r2 f2 g2. f4 
  e1 r1 
  d4 g,4. a8 bes4 f a r4 d4~
  d8 b d4 g,2 r1
  r2 d'2. d4 b2
  | r4 g2 d'4 d2 r2 
  | r2 e2. e4 e2 
  d2 c r1
  R\\breve*4
  
  % 96
  | r2 c2 a4. b8 c4 a 
  r2 a a4 f c'4. b8 
  a2 a r4 a2 c4 
  a2 r2 r1
  R\\breve*4
  
  % 104
  | a4 d2 c4 d2 r2
  r4 d4 e e f d e2 
  r2 c4 g4. a8 b4 c2 
  r4 g4. a8 b4 c g'4. f8 d4 
  e1 r2 e 
  a,2. cis4 cis1
  R\\breve*4

  % 114
  | r1 r2 g2~
  g4 a b b c2. b4 
  a f g2 a f4 a4~
  a8 b c4 f,2. g4 a2 
  r2 d g,1 
  R\\breve*3
  
  % 122
  | d'2. g2 d g,4~
  g4 g'2 d b4 d2 
  | r2 d d c4 c 
  c2. a4 a2 r2
  r4 c2 f, c'4. bes8 a4 
  r4 f'4. c8 c4 r2 bes 
  f r2 g d' 
  r4 d2. a4 f'4. e8 d4 
  r1 r4 d4 d2 
  r2 b b r2
  r4 g'2 g4 g g g2 
  | c, r2 r4 c2 e4 
  g c, c1 g2 
  r4 b d2 r2 d,2~
  d4 g4 d2 r4 d' d2~
  d4 g,2 b g4 r4 g 
  | g\\breve~
  g1
}

notesIIIBaritone = \\relative c {
  \\clef bass

  R\\breve*12

  % 13
  | g'1. g2 
  g f d f 
  f a1 g2~
  g2 f2 e1 
  d1 r2 d2~
  d4 f4 f4. g8 a4 d, f2 
  c2. e2 c4 d4. e8 
  f2 f4. e8 d1~
  d1 r2 d4 d 
  g2 c, f f4. e8 
  d\\breve
  d\\breve
  R\\breve*10
  
  % 35
  | r1 r2 e2 
  e2 e d1 
  e2 c f2. e4 
  d1 r1
  R\\breve
  
  % 40
  | r2 g2 g4. f8 d2 
  r1 r2 d4 g4~
  g4 e2 e4 e4. f8 g2 
  r4 c c2 r4 b2 g4 
  g2 r4 g2 d'4. g,8 b4~
  b8 c d4 d, g2. b4 g 
  a4. b8 c2 r1
  R\\breve*10
  
  % 57
  | r1 r2 r4 c4~
  c4 g2 b4. a8 g2 f4 
  g4 e g2 r2 d'2~
  d2 g,2 b b 
  a g4 e f d2 f4 
  a f c' c,2 e4 g c, 
  r4 g'4. a8 b g a2. e4 
  a2 r4 d, f2 f4. e8 
  d\\breve
  R\\breve*4
  
  % 70
  c2 g'2. c4 c2 
  r2 c c2. g4 
  c4 g g2 r2 f 
  c'4 c,4. d8 e4. f8 g4. c,8 c'4 
  r4 d4 d2 r2 g,4 g4~
  g4 g g g r2 g 
  d8 e f g a4 f c'2 r2
  R\\breve*7
  
  % 84
  | r2 d2 d g, 
  g r2 r1
  r2 d2. d4. e8 f d 
  | g1 r1
  r2 d4. d8 g4 b4. a8 g f 
  e2 b' r1
  r2 e,4. e8 a4 c4. b8 a g 
  f4 d e2 r1
  R\\breve*4
  
  %96
  | r2 c2 f c 
  r2 c' a a4. g8 
  f2 c r4 d e2 
  f r2 r1
  R\\breve*4
  
  % 104
  | r4 d4 a'2 d, r2
  r4 d4 a' a d,2 a' 
  r1 r2 g2 
  | g g g1 
  g2 r2 r2 a2~ 
  a2 a a1~
  a1 r1 
  R\\breve*11
  
  % 122
  | g1. g2 
  g\\breve 
  r1 r4 a2 a4 
  | a4 f c'2 a4 c2 f,4 
  a2 r4 a f a a2 
  r2 r4 a4. g8 f d d'2~
  d4 bes4 bes2 r2 g 
  d2 a' a r2
  r4 c2. f,2 r4 d'4~
  d2 g,4 b r2 b2~
  | b4 b b g2 c c,4~
  | c8 d e4 r2 e4 g2 c,4~
  c4 c'2 g4 g1 
  r2 d d1 
  r1 d 
  d\\breve~
  d\\breve~
  d1
}

notesIIIBass = \\relative c {
  \\clef bass

  R\\breve*13

  % 14
  | r2 d1 d2 
  d d a c~
  c2 d a a 
  d1 f1~
  f2 d f1 
  e1 c2 g' 
  r2 d1 d2 
  g d d1 
  r1 r2 d2 
  d g1 g4. f8 
  e1 r2 c4 c 
  c1 r1
  R\\breve*9
  
  % 35
  | r1 r2 e2 
  a, a' a f 
  g1 a2. a4 
  g1 r1
  R\\breve
  
  % 40
  | r2 g,2 g d'4. f8 
  e4. d8 c2 c b 
  c g'1 c,2~
  c2 c d b 
  r4 d2 g,4 g1~
  g\\breve
  R\\breve*11
  
  % 57
  | r1 r2 c2~
  c2 g2 b a 
  c1 g 
  r2 g'1 d2 
  f e d f2~
  f2 c2 e e 
  d2 d1 e2 
  f4 f g2 a1 
  g\\breve
  R\\breve*3
  
  % 69
  | r1 g1 
  g2 g e1 
  r2 c c c 
  c2. c4 c2 r4 a4~
  a4 e' e a2 g4 e4. f8 
  g4 g, g2 r2 d' 
  d2. d4 c2 c 
  f2 f r1
  R\\breve*7
  
  % 84
  | r2 d2 g1 
  c,2 r2 r1 
  r2 g'2 a1 
  b1 r1
  r2 g2. g4 g2 
  g2 g r1
  r2 a2. a4 e2 a a r1
  R\\breve*4
  
  % 96
  | r2 a,2 d a 
  r2 a d a 
  d a r4 d a'2 
  d, r2 r1
  R\\breve*8
  
  % 108
  | r1 r2 a2 
  cis2 e1 cis4 a 
  e'2 a, r1
  R\\breve*11

  % 122
  | d1. d2 
  d\\breve 
  r2 f f f4 f 
  a2 f r4 c2 a4 
  c2 r2 c c 
  c4 c f1 bes,2 
  d1 g, 
  r4 d'2 d4 f f bes2
  g1 a 
  g1 r2 g 
  g2 g4 g g1 
  e4 c g'1 c,2 
  c\\breve 
  g\\breve~
  g\\breve~
  g\\breve~
  g\\breve~
  g1
}

% ------------
% Choir 4
% ------------

notesIVSoprano = \\relative c {
  R\\breve*18
  r1 r2 d''2~
  d2 d d d 
  g, b1 a2~
  a4 g4 g1 fis2 
  g1 r2 g2
  g4 c4. d8 e4 f2. f,4
  f4 c'2. f,4 bes4. a8 g4 
  r4 e a c bes4. a8 g4 d 
  e2. f4 g1 
  R\\breve*7
  
  % 35
  | r1 r2 e'2 
  e2 e f1 
  e2. c4 d2 d 
  d1 r1
  R\\breve
  
  % 40
  | r2 b2 b4. c8 d2 
  r4 g, g2 r2 g 
  g4 g4. g8 g4 r1
  r2 g'2 g g2~
  g4 f8 e d2 d g, 
  d'\\breve
  R\\breve*13
  
  % 59
  | r2 g1 d2 
  f e d d 
  a c b4 a8 g f4 d 
  r4 a'2 f4 g2 e4. f8 
  g8 a b4 g d' d2 r2 
  a b4. c8 d e f4. e8 d4~
  d8 c8 b4 g d'2 b4 b2 
  R\\breve*3
  
  % 69
  | r1 b1 
  e,2. e4 e2 r4 e' 
  e2 e4 e2 e4 e2 
  r2 c4 c2 c4 c2~
  c4 c c2 r1 
  d4. d8 d2 r2 d 
  g2. g4 g2 g 
  f4 d d2 r1
  R\\breve*7
  
  % 84
  | r2 f2 d1 
  e r1
  r2 r4 d4 d2 a4 d 
  d1 r1
  | r2 b2. b4 b2 
  | g4 e g2 r1
  | r2 c2. c4 c2 a4 f c'2 r1
  R\\breve*4
  
  % 96
  | r2 c2 d c 
  r2 c d4 a2 c4 
  f,2 r4 c' f d2 cis4 
  d2 r2 r1
  R\\breve*4
  
  % 104
  | r4 d4 c8 b a g f4 a a2 
  r4 f a a f4. g8 a2 
  r2 r4 g4 g2 g 
  r2 r4 d'4 g, c d g~
  g4 e e2 r2 cis2~
  | cis2 cis2 cis4. d8 e2 
  R\\breve*4
  
  % 114
  | r1 r2 e,2 
  e g4 g a2 e 
  r1 r4 a4 d2 
  e4 e f2. e4 d2~
  d4 g,4 d'2 c1 
  R\\breve*3
  
  % 122
  | d1. d2 
  d\\breve 
  R\\breve*3
  
  % 127
  | r1 r2 d2 
  d d4 d g2. d4~
  d4 c8 bes a4 d,4. e8 f4 r2
  r4 e2 g4 d f4. g8 a4 
  r4 b b2 r1
  r2 g2 g4 g g c 
  c2 r2 c e2
  e4 e e1 e2 
  r2 b b2. d4~
  d4 b b2. g4 d'2 
  r2 d g1
  g\\breve~
  g1
}

notesIVAlto = \\relative c {
  R\\breve*15

  %16
  | r2 a''1 a2 
  a2 a d, f 
  f2 a a4. g8 f4 d 
  e2 c r2 g'4 g 
  g2 fis g1 
  r1 r2 d'2 
  b c a1 
  b2 b b b 
  c c4. bes8 a4 f c'2 
  f, a4 a d,1 
  r2 a4 a d2 g,4 g'4~
  g4 g c,2. d4 e2 
  a,1 r1
  R\\breve*6
  
  % 35
  | r1 r2 a'2 
  a2 a2. f2 d4 
  g2 e a r4 d,4~
  d4 b g g'2 e4 e2 
  R\\breve
  
  % 50
  | r2 g2 g g 
  c,4 e r4 e e2 r4 g 
  c,4 g' g2 r2 g 
  c, r2. g'4. b8 b4~
  b8 g g4 r4 d d2 r4 b 
  g2 r4 g'2 d d4~
  d8 c8 a4 e'2 r1
  R\\breve*11
  
  % 58
  | r1 r2 c'2~
  c2 g b b 
  a r4 g2 b4. a8 g4~
  g4 fis4 g2 r2 r4 d4~
  d4 a2 c4 c g2 g'4~
  |g4 g g4. f8 d4 f a c4~
  c8 b a4. g8 g2 fis8 e fis2 
  g\\breve 
  R\\breve*3
  
  % 69
  | r1 r2 g2 
  g2. c,4 c2 r2
  r4 g'4 c2 c4 c4. c8 c4 
  r2 r4 c,4 c2 c 
  r4 c4. a8 a4 r1 
  d4. g8 g2 r2 g4 g 
  g4 b4. g8 g2 g4 r2
  R\\breve*8
  
  % 84
  | r2 a2 g4. f8 d2 
  g2 r2 r1
  r2 g4 d4. a'8 a4. d,8 d4 
  r4 g2 d4 d2 r2
  r2 g2. g4 g2 
  c b r1
  r2 a2. a4 a2 
  a2 a r1
  R\\breve*4
  
  % 96
  | r2 a2 a a 
  r2 a a a 
  a a r4 a a2 
  a r2 r1
  R\\breve*4
  
  % 104
  | r4 d,4 e2 f4 d r2
  r4 a'2 c4 d a2 c4 
  r2 c,4 g'4. d8 g4 e g 
  r4 g g2 g r2
  r1 r2 a2~
  a2 a2 a1~
  a1 r1
  R\\breve*4
  
  % 115
  | r2 e2 e e4 4 
  a2. g4 f4. e8 d4 a 
  a2 a' d, a' 
  d,1 r1
  R\\breve*3 
  d1. d2 
  d\\breve
  R\\breve*3
  
  % 127
  | r2 f2 f f4 f 
  bes1. g2 
  a1 r2 g2~
  g4 e4. d8 c4 r4 a d2 
  r4 d4. g8 g4 r2 r4 b4~
  b4 b b b c2 c 
  r2 b4 g2. e2 
  r4 g g g g c2 g4 
  r4 g,2. g2 r4 g' 
  b1 r2 b 
  b\\breve~
  b\\breve~
  b1
}

notesIVTenor = \\relative c {
  \\clef "treble_8"
  
  R\\breve*16

  % 17
  | r2 d'1 d2 
  d2 d a a 
  c e1 d2 
  d2. c4 b1 
  b2. g4 b4. c8 d2~
  d2 cis2 d1 
  r2 d g,4 b4. c8 d4 
  r2 e a,4 c c2 
  r4 f, c'2 bes4 d2 g,4 
  r4 c2 f,4 bes g d'2 
  r4 g, g2 r1
  R\\breve*7
  
  % 35
  | r1 r2 c2 
  c c d d 
  g, g' f4 d4. c8 a4 
  d1 r1
  R\\breve
  
  % 40
  | r2 d2 d4 d d2 
  r2 e e r2 
  e g2 g r2 
  g, c b4 g d'2 
  r2 d1 d2 
  d\\breve
  R\\breve*11
  
  % 57
  | f1 c2 e2~
  e4 d b2 d f 
  e4 c2. b2 g 
  f4 d e4. f8 g1 
  r2 g'1 d2 
  f f e2. c4 
  d2 b d r4 a 
  d4. c8 b4 g' f d r4 d 
  b g d'2 d1 
  R\\breve*4
  
  % 70
  | c2 c c4. d8 e2 
  r4 e, g2 g4 g4. g8 g4 
  r2 r4 e'4. d8 c4. b8 a4 
  r4 e'4. c8 c2 g'4. e8 e4 
  b4 d4. d8 g,4 r2 r4 d4 
  d4. d8 d4. g8 g4 g r2
  R\\breve*8
  
  | r2 a4 d2 g,4 d'2 
  c1 r1
  r2 d4 d4. c8 d e f4 d 
  d1 r1
  r2 b2. b4 d2 
  e d r1
  r2 c2. d4 e2 
  f2 e r1
  R\\breve*4
  
  % 96
  | r2 e2 f e 
  r2 e f e 
  d c r4 f e2 
  d2 r2 r1
  R\\breve*4

  % 104 
  | r4 a4. b8 c4 f,2 r2
  r4 f4 c' c f,2 c' 
  R\\breve*2
  
  % 108
  | r1 r2 e2~
  e2 e2 e1~
  e1 r1
  R\\breve*3
  
  % 114
  r2 e2 e e4 e 
  g2. f4 e a,8 b c d e4~
  e8 d8 d4. b8 c4 d2 f 
  e d d1 
  R\\breve*4
  
  % 122
  | b1. b2 
  b r4 b2 b4 b g 
  d'2. c8 b a2 r2 
  f4 c'2 f,4 r4 f c'2~
  c4 d8 e f2 r4 f2 c4 
  r4 c c2 r1 
  d2 d d4 d g2 
  f r4 d2. d2 
  r1 d, 
  d2 r4 d' d d d g, 
  g2 r2 r2 e2 
  e2 r2 g g 
  r2 e e'4 e2 e4 
  b4 d g, b b1 
  r2 r4 d,4 g b g d'~
  d4 b4 d2 d1~
  d\\breve~
  d1
}

notesIVBaritone = \\relative c {
  \\clef bass

  R\\breve*15

  % 16
  | r1 a'1~
  a2 a a a 
  d, f f a~
  a2 g g1 
  r2 d'1 d2 
  d2 d g, a 
  b g a a 
  g1 r2 g2~
  g2 c,2 f2. a4~
  a4 f4 f2 r1
  R\\breve*9
  
  % 35
  | r1 r2 a2 
  a a f1 
  c'2 c f,4. g8 a2 
  b1 r1
  R\\breve
  
  % 40
  | r2 b2. g4 g2 
  g1 r1 
  g2 g r4 c,2 c'4~
  c8 g g4 r4 g2 b2. 
  b4. c8 d2 r4 g,2 d'4~
  d4 g,4 b4. c8 d2 g, 
  R\\breve*10
  | r1 r2 bes2~
  bes2 f2 a g 
  g1 r2 r4 c,4~
  c8 d e4 c g'2 d4 d2 
  r1 r2 d'2~
  d2 g,2 b b 
  a1 g2 g2~
  g4 d g2 f4 d a'2~
  a4 d,4 d2 r4 a' d2~
  d2 b b1 
  R\\breve*4
  
  % 70
  | c2 g2. g4 g2 
  r4 c,4. e8 e4. c8 c'4 r4 c,4~
  c4 g'4 g c4. c8 c4 r2
  r4 c,2. g'4 c, r2
  r4 b4. b8 b4 r2 r4 b'4 
  g4 g d'4. g,8 g4 g r2
  R\\breve*8
  
  % 84
  | r2 a2 b2. a4 
  g2 r2 r1 
  r2 d'2 a d, 
  r4 d d2 r1
  r2 d2. d4 d2 
  c d r1
  r2 e2. e4 c2 
  f c r1
  R\\breve*4
  
  % 96
  | r2 e2 d e 
  r2 c f4 d a'2 
  d,2 e r4 f c a' 
  a2 r2 r1
  R\\breve*4
  
  % 104
  | r4 a4 a2 a r2
  r4 a4 a a a2 a 
  R\\breve*2
  
  % 108
  | r1 r2 e2~
  e2 e e1~
  e1 r1
  R\\breve*3
  
  % 114
  | r1 r2 e2 
  e2 e4 e a2. g4 
  f2 e d1 
  a'2 d, a'1 
  R\\breve*4
  
  % 122
  | d,1. d'2 
  b g2. d4 g2 
  r2 a a4 a a c~
  c4 f,2 c2. c2 
  r4 f2 c' f,4 f2 
  r4 f4. e8 c4 r4 f2 d4 
  d1 r2 d 
  f1. r2 
  e2 c r4 a'4. g8 f4 
  r4 d'4. c8 b4 r4 g g g~
  g8 a b2 b4 r4 g c, g'~
  g4 c r2 c2. g4 
  g1 r2 g 
  g1 r2 g 
  g4. a8 b4. c8 d2. b4 
  b\\breve~
  b\\breve~
  b1
}

notesIVBass = \\relative c {
  \\clef bass

  R\\breve*16

  % 17
  | r1 d1~
  d2 d2 d d 
  a2 c1 g2 
  d' d g,1 
  r2 g'1 f2 
  e1 d 
  g,1 g2 g 
  c2. c4 f,1~
  f1 r1
  R\\breve*9
  
  % 35
  | r1 r2 a2 
  a2 a d1 
  c2 e d2. d4 
  g,1 r1
  R\\breve
  
  % 40 
  | r2 g'2 g r4 g4~
  g4 e4 g2 g1 
  r2 c, c e2~
  e2 c g'1
  g2. f8 e d1 
  d\\breve 
  R\\breve*11
  
  % 57
  | r2 f1 c2 
  e4 e d1 a'2~
  a4 g e2 g r4 g, 
  d'2 c b4 g2. 
  d'2 r2 r2 d2~
  d2 a c c 
  g1 d'2 c 
  d2 g,2 d'1 
  g,\\breve
  R\\breve*3
  
  % 70
  | r1 d'1 
  c2. c4 c2 r4 g' 
  g2 c, e2. e4 
  e2 r2 r4 a,2 a'4~
  a4 a e c2 c4 e c 
  r4 g' g2 r2 g, 
  g4 g b b e2 c 
  R\\breve*10
  
  % 86
  | r2 g2 d'1 
  g,\\breve 
  r2 g2. g4 b2 
  c2 g r1
  r2 a2. a4 c2 
  d2 a r1
  R\\breve*4

  % 96
  | r2 a'2 a a 
  r2 a d, r4 e 
  f a4. g8 e4 r4 d a2 
  d2 r2 r1
  R\\breve*8
  
  % 108
  | r1 r2 a2~
  a2 a4. b8 cis4 a cis2 
  a1 r1
  R\\breve*11
  
  % 122
  | g1. b2 
  d g, g1 
  r1 r2 c2 
  c2 c4 c f1 
  c1 r2 c a c r2 f 
  f g4 a bes2 bes 
  a1 d, 
  r1 r2 d2~
  d4 g,4 d'2 r2 d4 d
  d2 g,4 g'2 c,4 e2 
  e4 g2 d4 r4 g2 e4~
  e8 f8 g2 c, g'4 g2 
  r4 g2 d g,4 d'2~
  d2 g2 g1~
  g\\breve~
  g\\breve~
  g1
}

% ------------
% Choir 5
% ------------

notesVSoprano = \\relative c {
  R\\breve*22

  % 23
  | r2 d''2 d d 
  e1 c 
  c2 f2. e4 d2~
  d4 c4 c1 b2 
  c2. d4 e1 
  f2 c d2. c8 bes 
  a4 d, a'2 r2 d2~
  d2 g,2. a8 b c2 
  r2 e e e 
  g1 f2 d 
  e2. e4 e1~
  e1 r1
  R\\breve*5
  
  % 40
  | r2 d2. g,4 b2 
  g2 g' g g 
  g1 r2 g, 
  c4. d8 e2 r2 d4 b~
  b4 g2 b4. a8 g4 r4 d'4~
  d4 b b2 r4 b2 d4 
  d2 r2 r1
  R\\breve*8
  
  % 55
  | r1 r2 f2~
  f2 c e d~
  d4 d4 c2 r4 c2 g4~
  g4 c d2. g,4 c a 
  | r4 e'2 c4 d g,2 d'4 
  | d2 r2 r1
  R\\breve*8
  
  % 69
  | r1 b1 
  e1. e2 
  e1 r1 
  g2 e c f2~
  f4 e e2 r4 c g'2 
  g1 r2 g4 d~
  d4 d b2 e,4 g2 e4 
  r4 a d,2 r1
  R\\breve
  
  %78
  | d'1 e2 e 
  f f g1 
  f2 e e1 
  e r1
  R\\breve*4
  
  % 86
  | r4 g,4 g2 r2 d 
  d r4 d'2 d4 b2 
  g4. a8 b2 r1
  R\\breve*6
  
  % 95
  | r1 r2 e2 
  f e r2 e 
  f e d c 
  r4 f e2 d r2
  R\\breve
  r4 d4 c2 b r4 e 
  d4 d c2 b r2
  R\\breve*6
  
  %108
  | r1 r2 e2~
  e2 e e1~
  e1 r1
  r1 r2 e2 
  e2 e4 e g2. f4 
  e2. d4 c2 b 
  a2 e' e1 
  R\\breve*7
  
  % 122
  | d1. d2~ d4 e8 f g2 g1 
  R\\breve*2
  
  % 126
  | r2 c,2 c c4 c 
  f1. d2 
  r4 d g, d'4. c8 bes4 r4 g 
  d'4 a2 d4 r4 d2 d4 
  e4 e g2. fis4 fis2 
  g1 r2 d 
  d2 d4 d e1~
  e2 d2. c4 c2~
  c1 g2 r4 g4~
  g4 f8 e d1. 
  r2 d'2 d1~
  d\\breve~
  d\\breve~
  d1
}

notesVAlto = \\relative c {
  R\\breve*22
  r1 r2 g''2 
  g g a1~
  a1 f2 g 
  a2. a4 g1~
  g2 e2. f4 g2 
  c,2 f2. g4 a2 
  d,2 f d4 g2 g4~
  g4 d4 d2 r1 
  e2 a a c~
  c2 b2. a4 a2~
  a2 gis2 a1 
  R\\breve*6
  
  % 40
  | r2 d,2 d4 d d2 
  r2 r4 g2 g4 g2~
  g4 c, c2 r4 g'4. e8 e4~
  e8 c c2 e4 g2 r2
  r2 r4 g,4 g2 g'4 d 
  r4 g d2 d2. g4 
  f d g2 r1
  R\\breve*7
  
  % 54
  | r1 r2 c2~
  c2 g b4 b a2 
  r4 a a c4. c8 g2 bes4~
  bes4 f4 a2. f4 g2 
  g1 r2 a 
  e4 g2 c,4 g'1 
  R\\breve*9
  
  % 69
  | r2 d2 g2. g4 
  g1 r2 g4 g~
  g4 c,2 e e4 e2 
  r2 c' c a 
  c r4 c,4. e8 e4. c8 c4 
  r4 b4. c8 d4 r2 d2 
  d4. g8 g4 g g g r2
  R\\breve*2
  
  % 78
  | r2 g1 c2 
  b4 a2 d,4 g2 e 
  r2 e g4. f8 e4. d8 
  c1 r1
  R\\breve*3
  
  % 85
  | r1 r4 a'4 d2 
  d4. c8 b2 r4 a4. g8 f4 
  r2 d4. d8 g4 b4. a8 g f 
  e4 c d2 r1
  R\\breve*6
  
  % 95
  | r1 r2 e2 
  a a r2 a 
  a a f4 a a2 
  r4 a a4. g8 f2 r2
  r1 r4 a4 c2 
  g e4 g2 d4 r4 g 
  g4 g g2 g r2
  R\\breve*6
  
  % 108
  | r1 r2 e2~
  e2 e e e 
  e2 e4 e a1~
  a2 g2 a e 
  r2 a2. g4 a b 
  c2 b a e 
  e1 r1
  R\\breve*7
  
  % 122
  | d1 b2 g 
  d'2. g2 f8 e d4 b 
  r4 d d2 r1
  r1 r2 a'2 
  a2 a4 a c2 a 
  a1 r2 d,2~
  d1 d1 
  r1 f2 bes, 
  r4 g' g2 r2 r4 d4~
  d8 b b g g2 r4 g'2 g4
  g4 g g2 g r2 
  r4 g2 b4 e,1 
  r2 c' c4 c2 b8 a 
  b2 b r2 b2
  b2. g4 g1~
  g\\breve~
  g\\breve~
  g1
}

notesVTenor = \\relative c {
  \\clef "treble_8"
  R\\breve*23

  % 24
  r2 c'2 c c 
  f1. bes,2 
  c a bes2. a4 
  g2 c4. b8 g1 
  f2. g4 a1 
  f2. a4 g2 d 
  r2 d' g,4 c e2
  e4. d8 c4 e a,1 
  r2 g d' d 
  g1 c,2 e 
  e2. b4 c4. d8 e4 c 
  d2 g, r1
  R\\breve*4
  
  % 40
  r1 r2 g'2 
  g2 g c, r2
  r4 c2 e4 g c, c2~
  c4 c g2 r4 b d2 
  r2 d,2. g4 d2 
  r2 r4 d'4 d g2 d4 
  d2 r2 r1
  R\\breve*4
  
  % 53
  f1 c2 e2~
  e4 d4 b2 d4 d f4. f8 
  e4 c2. d2 d 
  d4 f2 c4. d8 e c d2~
  d2 a2 r4 c2 e4~
  e4 g2 d4 d2 r4 c4~
  c4 c e2 b4 d4. c8 b4 
  r4 d g2 d r2
  R\\breve*10
  
  % 69
  r2 g,4 d'2 d4 b2 
  r2 c4 g'4. e8 e4 r2 
  c4 g'2 c,4 g c4 c e~
  e4 c4. g8 g4 r1 
  e4 a2 a4 r2 r4 g4~
  g8 d' d2 d4 r2 b4 b4~
  b8 c d2 d4 r2 r4 c4~
  c8 b d4. c8 a4 r1
  R\\breve
  b1 c2 c 
  d d e2. b4 
  d2 c b1 
  a r1
  R\\breve*4
  
  % 86
  r1 a4 f4. e8 d4 
  r4 b' b2 r4 g4. g8 g4 
  g2 g r1
  R\\breve*6
  
  % 95
  r1 r2 g2 
  d'2 c r2 c 
  d4 d c2 f, r2
  r4 a4. b8 c4 d2 r2
  r1 r4 f4 e2 
  d4 d g,2 d' r4 c 
  d4 d e c d2 r2
  R\\breve*6
  
  % 108
  r1 r2 cis2~
  cis2 cis cis r4 c 
  c2 c4 c e2 a, 
  r2 e a b 
  c1 b 
  R\\breve*9
  
  % 122
  g4. a8 b4. c8 d2. e8 f 
  g4 d d2 r4 d b d4~
  d4 a4 a2 r1
  r1 r2 c2 
  c4 c c f2 c4 c2 
  r1 bes4 d4. c8 bes4~
  bes4 f'4 r4 g d2 r2 
  d2. a4 d2. bes4 
  c2 g r4 d' a2 
  r1 r4 d2 d4
  d4 b b2 r4 c2 e4~
  e8 c c4 r2 c4 g g2 
  r2 g'2. e4 e2 
  r4 b b4. a8 g2 r4 g4~
  g4 b b2 r2 b 
  b\\breve~
  b\\breve~
  b1
}

notesVBaritone = \\relative c {
  \\clef bass
  R\\breve*23

  % 24
  r1 r2 f2 
  f f bes1 
  a2 f g g 
  c,1 r2 c' 
  c4. bes8 a4. g8 f2. g4 
  a2 d, d1~
  d1 r2 g 
  c, c c1 
  r4 g'2 e4 f4. g8 a2 
  r2 e1 a2 
  g2 e r1
  R\\breve*5
  
  % 40
  r2 g2 b4 b4. c8 d4 
  r2 g, g g2~
  g4 g4 g2 r2 g2~
  g2 c,2 r2 r4 g'4~
  g4 d2 d' g,4 d' g, 
  g1 r1
  R\\breve*4
  
  % 50
  r1 r4 f2 c4~
  c4 c'2 c4 b g a2 
  d,2 r2 r2 bes'2~
  bes2 f a g 
  g1 r1
  r2 g2. g4 a2~
  a4 f4. g8 a f g2 r2
  r2 c4 f,4. g8 a4 e2~
  e2 g d r2
  r1 d2 g 
  d r2 r1
  R\\breve*9
  
  % 70
  c2 e2. e4 g2 
  r2 r4 e4 e2 e 
  g4. g8 g2 r2 c4 c4~
  c4 a2 c4. c8 c4 g4. a8 
  | b4 g g2 r2 g 
  g4. b8 b4 b r4 c g2 
  R\\breve
  r1 r2 d'2~
  d2 g,2 g4 c4. b8 a g 
  f4 d4. e8 f4 c2 r2 
  d4 a'4. e8 a4 g e r4 e 
  e2. a4 f d a'2 
  R\\breve*4
  
  % 86
  r2 d2 d d 
  r2 g,2. g4 g2 
  c, g' r1
  R\\breve*6
  
  % 95
  r1 r2 e2 
  d2 e r2 a 
  d, e4 a2 d,4 e2 
  r4 d a'2 d, r2 
  r1 r4 d4 e c 
  g'4 g g2 g r4 c, 
  g'4 g c,2 g' r2
  R\\breve*6
  
  % 108
  r1 r2 a2~
  a2 a2 a1 
  r2 a a a4 a 
  c2. b4 a2 g 
  a1 e 
  r2 g a b 
  c1 b 
  R\\breve*7
  
  % 122
  g1. g2 
  d r4 d2 g4 g2 
  R\\breve
  r2 a2 a4 a a c4~
  c4 a r4 a2. f4 a4~
  a2 f4 c' r2 r4 f,4 
  f4 bes bes d2 d4 r4 d,4~
  d4 a'4 f d d2 r4 g4~
  g4 c, c2 r4 d2 d'4
  d4 d, g d r4 g g g 
  g d'2 g,4 r4 g2 c,4 
  | e4. f8 g2 r2 c 
  | c4 c c c2 c4 r2 
  d1 b2 b4. c8 
  d2 r4 d,2 e8 f g2 
  d\\breve~
  d\\breve~
  d1
}

notesVBass = \\relative c {
  \\clef bass

  R\\breve*26
  c1 c2 c 
  f1 f2 d 
  r2 d g, g'2~
  g4 f8 e d2 c1 
  r1 r2 e2 
  e2 e a f 
  g2. f4 e2 c4 a 
  e'1 a, 
  R\\breve*5
  
  % 40
  r2 g2 d'2 d 
  c2 c g' g4. f8 
  e4. d8 c2 e e 
  c1 r2 d 
  g b1 g2 
  b b4. a8 g1 
  R\\breve*4
  
  % 50
  r2 d1 a2 
  c c g d' 
  d f4 f c2 r2
  | r2 f1 c2 
  e d1 a'2~
  a4 g e2 g4 g f2 
  | d4 a'4. g8 f4 e c g'2 
  R\\breve*12
  
  % 69
  r1 g2 g2~
  g2 c, g' r4 c, 
  e2 e g4 g c,2 
  g'4 e2 c4 c2. c4 
  c4. d8 e2 r2 g2~
  g4 d4 d2 r2 d 
  b4. c8 d4 g, r4 g'2 c4 
  f, a2 d,4 g2 r2
  R\\breve
  
  % 78
  g1 c,2 e 
  d f e1 
  d2 a e'1 
  a,1 r1
  R\\breve*4
  
  % 86
  r2 d2. a'2 d,4 
  r4 d4. b8 b4. c8 d4 r2
  R\\breve*11
  
  % 99
  r1 r4 d4 a2 
  b4 g c2 g r2
  R\\breve*7
  
  % 108
  r1 r2 e'2~
  e2 a,1 e'2 
  e1 r1
  R\\breve*11
  
  % 122
  d1. g,2~
  g2 d'2 d1~
  d1 r1 
  r1 r2 f2 
  f2 f4 f a1 
  f1 r2 f 
  d g g1 
  r2 a f g 
  r4 e2. a2 d,2~
  d4 g4 g2 r2 g, 
  g2 g4 g c1 
  c2 g c c4 c 
  g'1 e 
  d1. b2 
  b4. c8 d2 r2 g, 
  g\\breve~
  g\\breve~
  g1
}

% ------------
% Choir 6
% ------------

notesVISoprano = \\relative c {
  R\\breve*24

  % 24
  r1 r2 g''2 
  c2 c g'2. f4 
  e4 c e2. d4 c2
  c2 r2 a a 
  a2 d2. c4 b g 
  b1 c2 c2~
  c4 a4 c2. b4 a2 
  g e r1
  r4 g4 b e,2 a e4~
  e4 g4. f8 e4 r2 e4. f8 
  g4 d g2 r1
  R\\breve*4
  
  % 40
  r2 b2 b4 d2 b4 
  r2 r4 c4. g8 g4. d8 d4 
  r2 r4 g4 e e'2 e4 
  e4 c c2 r2 r4 g4 
  | d'2. g2 g4 g2~
  | g4 d2. d1 
  R\\breve*5
  
  % 51
  r1 r2 f2~
  f2 c2 e d2~
  d4 d4 c2 r2 r4 c4~
  c4 g2 b d4. c8 c4~
  c4 g4 r4 g g d'4. d8 d4 
  d2 c c r2
  R\\breve*13
  
  %70
  r2 g1 c2
  c4. d8 e2 r4 e,2 
  g4 g c c g r2 r4 c4 
  c4. a8 a4 e'2 e, g4~
  g4 b4 b2 r2 g' 
  g4 g g2 g,4 g2 g4 
  r2 r4 a2 e4 g2 
  R\\breve
  g2 d'4 d c4. b8 g2 
  r4 f d a' e g g2 
  r4 d a'2 b1 
  c2 a a1 
  R\\breve*4
  
  % 86
  r4 b4 d2. d,2 a'4 
  r2 b2. b4 d2 
  e d r1
  R\\breve*6
  
  % 95
  r1 r2 b4. c8 
  d4 a c2 r2 c 
  f,4 a4. e8 e4 r2 e4 a~
  a4 f4 r4 a a2 r1
  r2 a4 d4. c8 c4 
  d2 r4 g, b d g, e 
  g4 g e2 g r2
  R\\breve*6
  
  % 108
  r1 r2 a2. e'2 cis4 cis1 
  r2 c c c4 c 
  e2. d4 c2 b 
  a e' e1 
  r2 e,2. f4 g2 
  e4 a4. b8 c a b1 
  R\\breve*7
  
  % 122
  g2 d'2. b2 g4~
  g4 d'2 b4 b2 r2
  r4 a2 a4 a f c'2 
  a4 c2. f,4 a2 f4 
  r4 c' c c c f2 f,4 
  c'4 a2. r4 bes2. 
  f'2 r2 r4 d4 bes2 
  r4 f'2. f2 r2
  r4 c2. a2 r4 d4~
  d2 d r2 b 
  b g4 g g2 g 
  r1 r2 g'2 
  g4 g g g2 g4 r4 g,4~
  | g4 d'2. d1~
  d2 b2 b1~
  b\\breve~
  b\\breve~
  b1
}

notesVIAlto = \\relative c {
  R\\breve*26

  % 27
  g''1 g2 g 
  a1. f2 
  f2 f g r4 g~
  g4 b4. a8 g2 e4 g c, 
  r4 a'2 e c4. d8 e4~
  e4 e2 e4 a, a d2 
  r2 g c a4 c4~
  c8 b b2 g4 a a e2 
  R\\breve*5
  
  % 40
  r2 g2 g4 g2 d4 
  r4 c g2. g'2 g4 
  g2 r2 g4 c4. g8 g4~
  g8 e e c g'2 r2 g4 d'4~
  d8 b b g g2 r4 d2 e8 f 
  g2. b2 g4 g2 
  R\\breve*4
  
  % 50
  r1 r2 c1 g2 b4 b a2 
  r4 a a c4. c8 g2 bes4~
  bes4 f a2. f4 g2 
  e4 g2 d4 g2 r2
  r4 c,4 e g2 d4 f a~
  a4 a4 r4 a e g g2 
  R\\breve*12
  
  % 69
  r2 b2 b4 b b2 
  r2 r4 c4 g2 c,4 c~
  c4 c c2 r2 r4 c4 
  c4. d8 e2 r4 f2 a4 
  a4 c4. c8 c4 r4 c, c e 
  r4 g4. g8 g4 r2 g4 g4~
  g8 g, g2 g4 r2 e' 
  a,4 a' a2 r1
  R\\breve
  r2 d,2 g4. f8 e4. c8 
  r4 d a'2 c b2~
  b4 a4 a1 gis2 
  a e r1
  R\\breve*4
  
  % 86
  b4 d2 g,4 r4 d' d2 
  r2 g2. g4 g2 
  g2 g r1
  R\\breve*6
  
  % 95
  r1 r2 g2 
  f4 a4. g8 e4 r2 e4 a~
  a4 a c a a2 r2
  r2 e4 a,2. a2 
  r1 d4 a'2 a4 
  r4 g g2 g r4 g4~
  g4 b4 c g2 b4 e,2 
  R\\breve*6
  
  % 108
  r1 r2 a2~
  a2 a a1~
  a1 r2 e 
  e e4 e e2. d4 
  c2 a b g2~
  g4 a4 b2 c4 a e'2~
  e4 d4 c2 g4 b2 c8 d 
  e1 r1
  R\\breve*6
  
  % 122
  d2 g,4 d'2 g d4 
  r4 d2 d4 d2 r2
  r4 f2 f4 f f a2 
  | f2 r4 c' c c f,4 a~
  | a2 f r4 c' c2 
  r2. f,4 bes,1 
  r1 bes'2. d4 
  d2 d, d r2
  r4 e2. a,1 
  r2 d d4 d g, g'~
  | g4 d d2 r4 e4. f8 g4 
  | g2 r2. c,2 c'4 
  c2 r4 c,2 e4. d8 c4 
  r4 g'2. d2 g, 
  r2 d' d1~
  d\\breve~
  d\\breve~
  d1
}

notesVITenor = \\relative c {
  \\clef "treble_8"
  
  R\\breve*23
  r1 r2 c'2 |
  c2 c d1 
  e2 f d2. d4 
  c1 r2 c 
  c c f1 
  f2 d r2 d2
  d2. e8 f e2. c4 
  e2 a, r2 a 
  b4 a b c d c b a 
  e'1. a,2 
  b b a1 
  R\\breve*5
  
  % 40
  r2 d2 d4 b b2 
  r4 c2 e4. c8 c4 r2 
  c4 g g2 r2 g'2~
  g4 e4 e2 r4 b b4. a8 
  g2 r4 g2 b4 b2 
  r2 b2. b4 b2 
  R\\breve*3
  
  % 49
  r1 r2 g'2~
  g2 d2 f1 
  e2. c4 d2 d2~
  d2 a2 c d2~
  d2 a2 c1~
  c2 d2 g, r4 c4~
  c8 d e f g4 g,2 b4 d d, 
  a'1 g 
  R\\breve*13
  
  % 70
  g'2 g1 g2 
  g r2 g e 
  c2 g' c,4 f4. e8 f d 
  e2 r2 r4 g,2 g4 
  g2 r2 r2 d'2 
  d4 d d4. f8 e4 c r4 c4~
  c8 a8 b c d e f4 r4 c g2 
  R\\breve
  
  % 78
  d'2. g2 e4 g2 
  d4 f4. e8 d4 c4. d8 e2 
  r2 a,4 e'2 d8 c b4 e 
  e1 r1
  R\\breve*3
  
  % 85
  r1 r2 a,4 d~
  d2 d r1
  r2 g,2. g4 b2 
  c b r1
  R\\breve*6
  
  % 95
  r1 r2 e2 
  a,2 e' r2 e4 a,~
  a4 f a e r4 a2 e4 
  r4 a c2 f, r2
  | r1 a4 a2 e4 
  r4 b' e2 b r4 e, 
  b'4 b e,2 b' r2
  R\\breve*6
  
  % 104
  r1 r2 e2~
  e2 e e1~
  e1 r1
  R\\breve
  r2 e e e4 e 
  | g2. f4 e2. d4 
  c2 a e'2. d4 
  c4 b e1 a,2 
  R\\breve*6

  % 122
  b2. g2 d' b4~
  b8 c d2 g,4 r d' d2
  r4 d,2 a'4 f a a2
  | r4 c2 c4 c f, f'2~
  | f4 c c2 r2 r4 f~
  | f4 f f f f2 f
  | r4 d2 bes4 bes2 r2
  | r4 f2 f4 a d r4 g,~
  | g4 g e2 r1
  | r4 d d g g g d2
  | r2 r4 g4. e8 e'4. d8 c4
  | c2 r4 g4 g2 r2
  | g2 c4 c c c2 c4
  | r2 g'2 g4 g g g~
  | g4 g r2 r4 g,2 d4~
  | d4 g2 f8 e d1~
  d\\breve~
  d1
}

notesVIBaritone = \\relative c {
  \\clef bass

  R\\breve*25
  r1 r2 g'2 
  g g c c4. bes8 
  a4. g8 f4. e8 d2 d4. e8 
  f8 g a2 d,4 r4 d'2 g,4 
  g\\breve 
  e1 e2 e2~
  e4 c4 g'2 r1 
  e2 g r4 c,2 c'4 
  g4 e g2 c,1 
  R\\breve*5
  
  % 40
  r2 g'2 g4 g g2 
  r2 r4 e4 e2 r2 
  c c4 g'4. f8 e4. d8 c4 
  c'2 r2 r2 g2 
  g2 g1 g2 
  r1 g2. g4 
  d2 r2 r1
  R\\breve*2
  
  % 49
  r2 d'1 g,2 
  b2 b a1 
  g1. f4 d 
  a'2. a4 g1 
  r2 c4 f,4. g8 a4 e2 
  r2 g1 c,2 
  e2. e4 d2 r4 d'4~
  d2 a2 c bes4 g 
  d'2 r2 r1
  R\\breve*11
  
  % 69
  r1  b2 b4 b4 
  g2 g2. e2 c4~
  c4 e4. f8 g4 r4 c c2 
  g r2 c4 f, f2 
  r4 c' c2 g4 c2 b8 a 
  d4 b d2 r2 r4 d,4 
  d4. b8 b4 b r4 g' g2 
  R\\breve
  
  % 77
  r1 r2 d2~
  d2 g e4 g2 g4 
  b4 d2 a4 r4 e g2 
  a4 d, e c r4 e g2 
  c,4. d8 e2 r1
  R\\breve*3
  
  % 85
  r1 r2 r4 d4 
  g2 g r2 r4 d4 
  d2 d r1
  R\\breve*7
  
  % 95
  r1 r2 g2 
  a2 a r2 a 
  a2 a a a 
  r4 a a2 a r2 
  r1 r4 a2 c4 
  | b2 c4 g4. a8 b4 r4 g 
  | g4 g g2 g r2
  R\\breve*6
  
  % 108
  r1 r2 e2~
  e2 e2 e1~
  e1 r1
  R\\breve
  r1 r2 e2 
  e2 e4 e a2 g 
  a1 e 
  R\\breve*7
  
  % 122
  g1. g2 
  g\\breve 
  r2 r4 f2 f4 f c4~
  c4 a'2 f4 r4 a a2 
  r4 a c2 c r2
  r4 f,2 f4 f f r4 bes4~
  bes2 bes r1 
  a2 d2. d,4 d2 
  r1 a'4 d4. c8 a4 
  r4 d4. g,8 g4 r2 g 
  b4 b4. c8 d4 r2 g, 
  g1 g 
  r2 g1 c,2 
  r2 r4 g'2 d d'4~
  | d4 g, d' g, r2 g 
  | g\\breve~
  g\\breve~
  g1
}

notesVIBassWTF = \\relative c {
  \\clef bass

  r2*111 d2 d d g2. f8 e d2 
  g2. f4 e2 a, e'2. e4 
  a,2 r2*33 g2 g g c1 r2 
  g c c g'1 e2 
  e d1. b2 b4. c8 
  d2 r4 g,2 g4 g1 r1. d'1 a2 c c g 
  g4 g d'2 c b4 g2. d'2 
  r2*79 g1 g1. g2 
  g1 r2 g e c 
  f2. f4 c2 c2. e4 c g'2 g4 g2 r2 g g g e e a f g1 a1*2 g2 g 
  g c, f a 
  g2. e4 f4. g8 a4 e4. f8 g a b4 e,2 a4 a2 r2*19 b2 a1 g r4*97 d4 
  a'2 d,4 d e2 d r1*16 a1 cis2 e a, a1 r1*23 g'1. g2 g1 
  r2 d d d f1 
  c r1. f2 
  f f a1 f2 r2 
  d4 f bes,2 d1 r2 d2. d4 d2 c1 f2 f4. e8 d2 r2. d2 d4 g,2 g'1 
  e2 c d e1 c2 
  g' r2 g g r4 g,2 d'4 
  d2 r2 d b d d1*5 
}

notesVIBass = \\relative c {
  \\clef bass

  R\\breve*28
  r1 g1 
  g2 g c1 
  r2 a a a 
  e'1 d2 f 
  e2. e4 a,1 
  R\\breve*6

  % 40 WTF
  r2 d2 g,4 g g'2~
  g2 e c d
  e1 c2 g'
  r2 g g r4 g,~
  g4 d' d2 r2 d2
  b2 d2 d1
  R\\breve*2

  % 48
  r1 r2 g2~
  g2 d f e
  d2 f1 c2
  e2 e d1
  f1 e4 c g'2
  r1 r2 c,2~
  c2 g b a
  c1 g2 d'
  d2 f4 f c2 r2
  R\\breve*12

  % 69
  r1 g'1
  e2 e c r4 c4
  g'2 g4 g2 e4 e2~
  e4 e e2 r2 c
  c2 a e'2. e4
  d4. c8 b2 r2 b'2
  b4 g g2 c,4 e4. f8 g4
  R\\breve*2

  % 78
  r2 g2 g c,
  f2 a g2. e4
  f4. g8 a4 e4. f8 g a b4 e,~
  e4 a a2 r1
  R\\breve*4

  % 86
  r2 g2 f4 d r d~
  d4 b4. g8 g4 d'2 r2 
  R\\breve*11

  % 99
  r1 r4 d a'2
  d,4 d e2 d r2
  R\\breve*7

  % 108
  r1 r2 a2~
  a2 cis e a,
  a1 r1
  R\\breve*11

  % 122
  | g1 b2 d~
  d2 b4 g d'2 g,2
  R\\breve
  r1 r2 c2
  c2 c4 c f2 c
  r2 c d1 
  bes2 d1 g,2
  r2 r4 d' a'2 g4. f8
  e4 c g'2 r2 d~
  d2 b d r
  r4 g2 g4 g e g2
  g2 r2 r2 c,
  c2 e1 c2
  | g'2 g g2. f8 e
  d1 r2 b2
  b\\breve~
  b\\breve~
  b1
}

% ------------
% Choir 7
% ------------

notesVIISoprano = \\relative c {

  R\\breve*28
  r1 d''1 
  d2 d e1 
  c2 a e'2. e4 
  e1 r2 d 
  b1 r4 c2 e4~
  e2 b4 e2 d4 c2 
  r2 g e a 
  e1 r1
  R\\breve*2
  
  % 39
  r2 g2 c c 
  g' r2 d d4 d 
  e1. d2~
  d4 c4 c1 c2 
  g r4 g2 f8 e d2~
  d4 d4 d2 r2 d'2~
  d2 g,2 b1 
  a2 g4 e f d4. e8 f g 
  a2. f4 g2 e 
  g1 r2 c,4 c 
  g'2. d4 d2 r2
  r4 d'2 f4. e8 d4 r4 c4~
  c4 e4 g g,2 d'4 d2~
  d4 a2 f4 g2. f8 e 
  d4 f r4 c' f2 e4. d8 
  c4. a8 b c d2 g,4 c a 
  r4 e'4. d8 c4 b g r4 d 
  f d a'2 r4 e g2 
  R\\breve*13
  
  % 70
  c4 g'2 e4 e2 r2
  r4 c4 g2 g4 g4. g8 g4
  | r2 g' f2. c4 
  r4 c c a r4 e g c, 
  g'1 r2 g 
  g g4 g'2 g,4. c8 c4 
  r4 f,4. e8 d4 r4 g2 b4 
  c a e'4. d8 c2 a 
  b1 r1
  R\\breve*7
  
  % 86
  r2 d2 d1 
  d1 r1
  R\\breve
  r2 d2. d4 b2 
  g2 a r1
  R\\breve
  r2 c2. c4 c2 
  a4 d2 b4 r2 g 
  e4 g2 d4 r2 g 
  e b' e,4 e' e2 
  R\\breve*3
  
  % 99
  r4 d4 c8 b a g f4 a a2 
  R\\breve*2
  
  % 102
  r2 r4 e'4 c2 c 
  r1 a2 e'4 e 
  a, a r2 r1
  R\\breve*3
  
  % 108
  r1 r2 e'2~
  e2 e2 e1~
  e1 r1
  R\\breve*11
  
  % 122
  d1. d2 
  d2. e8 f g4 g,2 d'4 
  d1 r1
  r1 r2 a2 
  a4 a a c4. bes8 a4. g8 f4~
  f4 c'4 c2 r1
  r1 r2 d2 
  d4 d d f4. e8 d4 d2 
  g,4 c4. bes8 g4 d'1 
  r2 r4 b2 b4 d2~
  d4 g,4 b2 g r4 g'~
  g4 g g g g2 g 
  | r2 g, c4. d8 e2 
  r2 d4 b2 g b4~
  b8 a8 g4 r4 d'2 b4 r4 g' 
  g2 r4 g2 d g4 
  g\\breve~
  g1
}

notesVIIAlto = \\relative c {
  R\\breve*27

  % 28
  r1 r2 a''2 
  a a b1 
  r2 g g g 
  c2. b4 a e a2~
  a2 g2 r2 f4 a 
  g4. f8 e2. a,4 c4. d8 e4 
  b4 r e f a2. 
  d,4 g r4 g c2 a2~
  a4 b4 c2 f,1 
  R\\breve
  r2 g g g 
  bes1 a2 a 
  bes4. a8 g1 g2 
  g r2 r4 g2 b4 
  e,1 r2 c' 
  c2. b8 a b1 
  b2 b b2. g4 
  g\\breve 
  R\\breve*24
  
  % 70
  r2 g2 c4 c c2 r2
  r4 g4 c2 g4 g4~
  g8 g g4 r2 r4 c,2 f4~
  f8 e c4 r2 c'4 c2 g4 
  r4 g4. a8 b4 r2 b 
  b2 b c2. c4 
  a d, a'2. g4 g2~
  g4 f4 a2. e4 f2 
  g1 r1
  R\\breve*7
  
  % 86
  d4 d2 d4 r1
  r4 d4 d4. c8 b2 r2
  R\\breve
  r2 d4. d8 g4 b4. a8 g f 
  e2 e r1 
  R\\breve
  r2 e2. e4 e a4~
  a8 e f4 g2 r2 g 
  g g r2 g 
  g g c, g 
  R\\breve*3
  
  % 99
  r4 d'4 e2 f r2
  R\\breve*2
  
  % 102
  r2 r4 g4 c,2 g' 
  r1 d4 a'2 c4 
  f, f r2 r1
  R\\breve*3
  
  % 108
  r1 r2 e2~
  e2 e2 e1~
  e1 r1
  R\\breve*11
  
  % 122
  g1. g2 
  g\\breve 
  R\\breve 
  r1 r2 f2 
  f4 f f a2 f4 c'2~
  c2 f,2 r4 f2 bes,4
  bes4 bes'4. a8 g4 r2 d 
  d1 r2 r4 g4~
  | g8 e e c c2 r1
  | r4 b2 b4 b b g2 
  g2 r2 r2 r4 g'4 
  g4 g g g2 c,4 c2 
  r4 g'4. e8 e4. c8 c2 e4 
  g2 r2 r2 r4 g,4~
  g4 g'2 d4 r4 d2. 
  b4 d g, g' g1~
  g\\breve~
  g1 
}

notesVIITenor = \\relative c {
  \\clef "treble_8"
  R\\breve*28

  % 29
  r2 d'2 d d 
  g1 r2 c, 
  c2 e e1 
  e2 b r2 d 
  g,4 b e, e'2 c4 c2 
  r1 r2 a2 
  bes2 bes c c4 c 
  c2 a a1 
  R\\breve
  r2 d2 c g' 
  g1 c,2 f 
  bes,4 d2 g,4 g2 r2 
  e4 e'2 c4 c2 r4 g 
  g2 r2 g4 g c2~
  c4 c c2 r2 g' 
  g2 g g r2 
  r4 b,2 d, d'4 b4. c8 
  d2 e4 c d1~
  d2 c c1
  b1 r1
  R\\breve*20
  
  % 69
  r1 d2 g,2~
  g4 g g2 r4 g' e2 
  c g'4 g c,2 c4 c4~
  c4 c r4 e2 a,4 a2 
  r2 e e e 
  r4 b'4. g8 g4 r2 g4 g' 
  g4 g2 d4 r4 c4. b8 g4 
  r2 d' e4 c d2 
  r2 a e a4 d4~
  d4 g, b2 r1
  R\\breve*7
  
  % 86
  d2 g r4 d d2 
  r2 b d g, 
  R\\breve
  r2 d'2. d4 g, g4~
  g4 e e2 r1
  R\\breve
  r2 e'2. c4 c2 
  r4 d b2 r2 b4 d 
  c4. a8 b2 r2 b 
  g b e e 
  R\\breve*3
  
  % 99
  a,4 d2 cis4 d2 r2
  R\\breve*2
  
  % 102
  r2 r4 g4 f2 e 
  r2 r4 g4 f f e2 
  d r2 r1
  R\\breve*3
  
  % 108
  r1 r2 a2~
  a2 a a1~
  a1 r1
  R\\breve*11
  
  % 122
  d1. d2~
  d4 b2 d g,4 b2 
  | a1 r1 
  c2 c4 c c f2 c4~
  c4 f,4 a2 r2 c2~
  c4 c2 a4 r4 d bes f' 
  f2 r4 bes,2 d4. c8 bes4 
  r2 r4 a4. f8 f d d2 
  r1 r2 d'2~
  | d4 d d d g2. d4 
  | d2 r2 r2 e2 
  | e2 r2 e g 
  g r2 g, c 
  b4 g d'2 r2 d2~
  d1 d~
  d\\breve~
  d\\breve~
  d1

}

notesVIIBaritone = \\relative c {
  \\clef bass
  R\\breve*27

  % 28
  r2 a'2 a a 
  d2. c4 b2 b 
  b2. b4 e,2 e 
  a a c1 
  g1 a 
  b2. b4 a1 
  R\\breve*4
  
  % 38
  r2 g2 g g 
  g4. a8 bes4 g a2 f 
  bes2 r4 g d2 d 
  r4 g c2. b8 a d2 
  g,2 c r4 g e2 
  g4 c,2 g'4 r4 d'4. b8 b4 
  r2 b b1 
  r2 g2. g4 d'2 
  r2 c f, f 
  d a' r1 
  r2 d1 g,2 
  b1 a2 g 
  R\\breve*19
  
  % 69
  r1 r2 g2~
  g4 c2 c4 c2 r4 g~
  g4 e2 c g' c,4 
  c2 r2 c4 c2 c4 
  r4 a' a a g e e2 
  r2 d8 d d4 r2 d' 
  d4. g,8 g4 g g g r2
  r2 f2 c4 e r4 g 
  c,2 c' c f,4 a 
  r4 d d2 r1
  R\\breve*7
  
  % 86
  g,2 d d r2
  r4 d4 d'2 g, d' 
  r4 g, g2 r1
  R\\breve*3

  % 92
  r2 e4. e8 a4 c4. b8 a g 
  f4 d d2 r2 b 
  e2 b r2 b 
  e b c4 e4. f8 g4 
  R\\breve*3
  
  % 99
  r4 d4 a'2 d, r2
  R\\breve*2
  
  % 102
  r2 r4 e4 f2 g 
  r1 f4 d e a~
  a4 a r2 r1
  R\\breve*3
  
  % 108
  r1 r2 cis2~
  cis2 a2 a1~
  a1 r1
  R\\breve*11
  
  % 122
  b1. b2 
  b1 r2 g 
  f2 d4 d a'2 f 
  f\\breve 
  f1 r2 f2~
  f2 c'4 f, f1 
  r2 r4 d2 g4 g2 
  r4 a4. g8 f4. d8 d'4 d2 
  | r1 r4 d,4. e8 fis4 
  | r2 g2. g4 g g 
  | g2 g r2 r4 e4 
  | e2 r2 c2. g'4~
  | g8 f e4. d8 c4 c'2 r2 
  r2 g1. 
  g1 r1 
  b1 b1~
  b\\breve~
  b1
}

notesVIIBass = \\relative c {
  \\clef bass
  R\\breve*27

  % 28
  r1 r2 d2
  d2 d g2. f8 e
  d2 g2. f4 e2 
  a,2 e'2. e4 a,2
  R\\breve*5

  % 37
  r1 r2 d2
  d4 d g1 c,2
  g1 r1
  r2 g g g
  c1. g2
  c2 c g'1
  e2 e d1~
  d2 b b4. c8 d2
  r4 g,2 g4 g1
  r1 r2 d'2~
  d2 a c c
  g2 g4 g d'2 c
  b4 g2. d'2 r2
  r\\breve*19

  % 69
  r1 g1
  g1. g2
  g1 r2 g
  e2 c f2. f4
  c2 c2. e4 c g'~
  g4 g g2 r g
  g2 g e e
  a2 f g1
  a\\breve
  g1 r1
  R\\breve*7

  % 86
  r2 b2 a1
  g1 r1
  R\\breve*4

  % 92
  r2 a2. a4 a2
  a2 g r g
  g2 g r g
  g2 g e e
  R\\breve*6

  % 102
  r2 r4 g4 a2 e
  r1 a4 a2 a4
  f4 d r2 r1
  R\\breve*3

  % 108
  r1 r2 e2~
  e2 e e1~
  e1 r1
  R\\breve*11

  % 122
  g1. g2
  g1 r2 d2
  d2 d4 d f1 
  c1 r1
  r2 f2 f f4 f
  a1 f2 r
  d4 f bes,2 d1
  r2 d2. d4 d d
  c2 c f f4. e8
  d2 r2 r4 d2 d4
  g,4 g g'1 e2
  c2 d e1 
  c2 g' r g
  g2 r4 g,2 d'4 d2
  r2 d2 b2 d
  d\\breve~
  d\\breve~
  d1
}

% ------------
% Choir 8
% ------------

notesVIIISoprano = \\relative c {
  R\\breve*32

  % 33
  r2 e''2 e e 
  g1 f2 e2~
  e4 d4 d1 c4 b 
  c4. d8 e4 a,2 b8 c d2 
  r1 r2 d2 
  d2 d e1~
  e2 d2. c4 c2~
  c2 b1 g2 
  g1 r1 
  r2 g'2 g g 
  g2 r4 g,2 d'4~
  d4 d2 d4 d1 b2 
  b1 r1
  R\\breve
  r1 r2 g'2~
  g2 d2 f e 
  d d a c 
  b4 a8 g f4 d a'2. f4 
  g2 e r2 r4 f~
  f2 a e g 
  R\\breve*16
  
  % 69
  r1 r2 g2~
  g2 c1 c2 
  c2 r4 c2 e c4~
  c4 e4. e8 e4 r4 a, c f, 
  r4 a4. e8 e4 r2 r4 g4~
  g4 d'4 g, d' r2 d 
  d2 d e e 
  f1 e2 d 
  c1 a2 d 
  d1 r1
  R\\breve*7
  
  % 86
  g,4 d'2 d4. a8 a4 r2 
  b4 g4. a8 b4 b2 r2
  R\\breve
  r2 b2. b4 d2 
  e c r1
  R\\breve
  r2 e2. e4 a,2 
  d d r2 d 
  g, d' r2 d 
  g, d'4. g,8 a b c a b2 
  R\\breve*3
  
  % 99
  r4 f'4 e2 d r2
  R\\breve*2

  % 102
  r2 r4 c4 c4. d8 e2 
  r1 a,4 d2 cis4 
  d d r2 r1
  R\\breve*3
  
  % 108
  r1 r2 cis2~
  cis4 b4 a2. g8 f e4 a4
  a4. b8 c d e4 r1
  R\\breve*11
  
  % 122
  g1. g2 
  g2 d d d4 d4 
  f1. c2~
  c2 f,2. c'4 c2 
  r2 a a4 a a c4~
  c2 a4 c r4 bes4. a8 f4 
  f2 r2 r2 d'2 
  d,4 f2. f2 r2
  r4 g4. e8 e4 r4 a a2 
  | r2 r4 d2 d4 d d 
  | g1 g2 r2 
  g, g4 g g c c2 
  r2 g4 e2 e'4. f8 g4~
  g4 d2 g,4 b d r4 d, 
  g d r4 g2 d'4 b d 
  d\\breve~
  d\\breve~
  d1
}

notesVIIIAlto = \\relative c {
  R\\breve*32

  % 33
  r1 r2 a''2 
  a g c1 
  bes2. g4 a2 a 
  a\\breve 
  R\\breve
  r2 g2 e2. g4~
  g2 d r4 a2 a4 
  d2 b4 g'2 g4. a8 b4 
  r2 r4 e,2. b2 
  r2 c2. e4 c g'~
  g4 g g2 r2 b, 
  b b2. d4 d2 
  r2 g2. b4 g2 
  R\\breve
  r2 c1 g2 
  b b a r4 g 
  g4 b4. a8 g2 f4 g2 
  r2 r4 d2 a c4~
  c4 g4 c2 r2 f 
  a4. g8 f2 c' r2
  R\\breve*16
  
  % 69
  r1 g2 g2~
  g4 e2 c4 e g r4 g 
  c2. g2 g e4 
  e2 r4 e a2 a4 a~
  a4 a a2 r1
  r4 g4. d8 d4 r2 d4 g,4~
  g8 g'8 g4 g g4. c,8 c4 r2
  r4 d2 a'4. g8 c4 r2 
  c,4. d8 e4 a,2 a' d,4 
  d1 r1
  R\\breve*7
  
  % 86
  g4 g2 g4 r2 d' 
  d4. b8 b2 r1
  R\\breve
  r2 g2. g4 g2 
  g2 c, r1
  R\\breve
  r2 a'2. a4 a2 
  a2 b r b 
  c b r b 
  c4 g4. f8 d4 a'2 g 
  R\\breve*3
  
  % 99
  f4 a4. g8 e4 a2 r2
  R\\breve*2
  
  % 102
  r2 r4 c4 a4. b8 c2 
  r1 f,4. g8 a4 a 
  a4 a r2 r1
  R\\breve*3
  
  % 108
  r1 r2 a2~
  a4 e2 a, a' e4~
  e4 f8 g a2 r1
  R\\breve*11
  
  % 122
  b1. b2 
  b\\breve 
  r2 a a a4 a 
  c2 a a1 
  r4 f2 f4 f f a2~
  a4 f4 f2 r2 f 
  bes, r4 g'2. g2 
  r1 r4 d4. bes8 bes g8 
  g4 g'4 g2 r1 
  g4. g8 g4 g b2. g4 
  g2 r4 g c, e r4 e 
  e2 r4 g c, g' g2 
  r2 g c, r
  r4 g'4. b8 b4. g8 g4 r4 d 
  d2 r4 b g2 r4 g'~
  g4 d4 g4. a8 b2 g4 b 
  b\\breve~
  b1
}

notesVIIITenor = \\relative c {
  \\clef "treble_8"
  R\\breve*33

  % 34
  r2 e'2 c c 
  g' d4 d e2. e4 
  e1 r1
  R\\breve
  r2 b2 c c 
  d2. e4 f1 
  g2 d1 d2 
  g,1 r2 g' 
  g2 g c,2. e4 
  e1 r2 r4 d~
  d4 d4. c8 b4 r4 g2 g4 
  g1 r1
  r2 g'1 d2 
  f2 f e4 e2 c4 
  d2. g,4 a4. b8 c4 g~
  g4 d' b d r4 d2 c4 
  d2. d4 d2 c4 a 
  r4 c e g2 d4 r4 d d 
  f2 c4 c2 bes4 g 
  d'2 r2 r1
  R\\breve*16
  
  % 70
  r1 r2 e2 
  e2. e4 e1 
  r4 g2 e4 a, c4. c8 c4 
  r2 e4 e4. c8 c4 r4 g'4~
  g8 d8 d4. b8 b4 r2 
  b b4. b8 b4 b r4 e2 e4 
  r2 a,4. b8 c4 g b g 
  r4 c2 f4 e2 d4. c8 
  b1 r1
  R\\breve*7
  
  % 86
  g'4 d2 b4 r2 d 
  d2 r2 r1
  R\\breve
  r2 g,2. g4 b2 
  c a r1
  R\\breve
  r2 c2. c4 e2 
  f d r2 d 
  e d r2 d 
  e d c b 
  R\\breve*3
  
  % 99
  r4 a4. b8 c4 f,2 r2
  R\\breve*2
  
  % 102
  r2 r4 c'4 c2 c 
  r1 d4 a a a~
  a8 d, a'4 r2 r1
  R\\breve*3
  
  % 108
  r1 r2 e'2~
  e2 e2 e1~
  e1 r1
  R\\breve*11
  
  % 122
  d1. d2 
  d\\breve 
  R\\breve
  r2 r4 c2 c4 c2 
  c4 f2 c4 c1 
  c1 r2 r4 bes4~
  bes8 a f4 bes2. g4 r4 d'4~
  d8 a a4. d,8 d4 r4 a' d2 
  r4 g, g2 r2 a 
  b2 b4 b b g d'2~
  d2 b2 e1 
  r2 d4 g, g2 r4 e'4~
  e4 e e e, e4. f8 g4 e 
  r4 g d d'2 b4 r4 g~
  g4 g'2 g4. d8 g4 g2 
  r1 g 
  g\\breve~
  g1
}

notesVIIIBaritone = \\relative c {
  \\clef bass
  R\\breve*32

  % 33
  r1 r2 e2 
  e2 e a1 
  g2 bes a2. a4 
  a\\breve 
  r1 r2 d2~
  d2 b2 g c2~
  c2 bes2 c1 
  d2. b4 b2 r4 g4~
  g4 c2 c,4. d8 e4 r2 
  e4 g2 c, c' g4 
  g1 r2 d2~
  d2 d d1~
  d1 r2 d'2~
  d2 g, b b 
  a1 g2. g4 
  g2 g f g4 e 
  g1 r1
  r2 f d f 
  r2 r4 g2. d4 f~
  f4 d a'2 r1
  R\\breve*17
  
  % 70
  e2. g4 g c,2 e4~
  e4 g g c2 g4 g2~
  g2 r2 r2 r4 a4 
  a4 a r4 e4. e8 c4 r2
  r4 d4. d8 d4 r2 d2~
  d4 g4 g b g g2 c,4 
  r4 f4. g8 a4 e g2 d4 
  e c2 d4 e c f4. e8 
  d1 r1
  R\\breve*7
  
  % 86
  g2 d' r2 r4 d4~
  d8 g,8 g4 r4 g b g4. f8 d4 
  R\\breve
  r2 g2. g4 g2 
  c, c r1
  R\\breve
  r2 e2. e4 e2 
  d2 d r2 d4 g~
  g4 c, d2 r2 d4 g~
  g4 c, d2 e4 c g'2 
  R\\breve*3
  
  % 99
  r4 a4 a2 a r2
  R\\breve*2
  
  % 102
  r1 a4 c2 g4 
  r1 a2 c4 c 
  a4 f r2 r1
  R\\breve*3
  
  % 108
  r1 r2 a2~
  a2 a a1~
  a1 r1
  R\\breve*11
  
  % 122
  d,1. d2 
  d\\breve 
  r1 r2 a'2 
  a2 a4 a c2 a 
  a1 r2 a 
  a2 a4 a d2 d 
  r4 d2 g,4 d'1 
  r2 a a r2 
  r4 g4 c2 r4 f, d a' 
  r4 g d2 r2 d2~
  d4 d d d r4 g c2~
  c4 b8 a d2 g, c 
  r4 g e2 g4 c,2 g'4 
  r4 d'4. b8 b4 r2 b 
  b1 r2 g2~
  g1 g1~
  g\\breve~
  g1 
}

notesVIIIBass = \\relative c {
  \\clef bass
  R\\breve*37

  % 38
  r2 g2 c c 
  g'1 f2 a 
  g2. g4 g2 g 
  g1 e4 c g'2~
  g2 c,2 c1~
  c1 g1 
  g\\breve
  r2 g'1 d2 
  f e d f~
  f2 c e e 
  d1. e4 c 
  d2 d1 e2 
  f2. g4 a f a2 
  e4 g2 c,4 g'2 r2
  R\\breve*17
  
  % 69
  r1 g,1 
  c1. c2 
  c\\breve
  r2 c a f 
  a1 c2 c 
  g1 r2 g 
  g2 g c c 
  d1 c2 b 
  a2. b4 c2 d 
  g,1 r1
  R\\breve*7

  % 86
  r2 d'2 d1 
  d\\breve 
  R\\breve*4
  
  % 92
  r2 a2. a4 c2 
  d g, r2 g 
  c g r g 
  c g c4 a e'2 
  R\\breve*6
  
  % 102
  r2 r4 c4 f2 c 
  f, r4 c' d d a2 
  d2 r2 r1
  R\\breve*3
  
  % 108
  r1 r2 a~ 
  a2 a a1~
  a1 r1
  R\\breve*11

  % 122 
  g1. g2 
  g\\breve 
  r1 r2 f2 
  f2 f4 f a2 f 
  f1 r2 f 
  f2 f4 f bes1~
  bes2 g1 bes2 
  d1. g,2 
  c e d1 
  g, r2 g2~
  g4 g d'4. f8 e4. d8 c2~
  c2 b c g'~
  g2 c, c1 
  d2 b r4 d2 g,4
  g\\breve~
  g\\breve~
  g\\breve~
  g1
}`,ft="/assets/spem-choir1-B8n6nxbr.svg",ht="/assets/spem-choir2-COV_cwHF.svg",bt="/assets/spem-choir3-dPP7Ozwd.svg",mt="/assets/spem-choir4-CCS2mjvH.svg",vt="/assets/spem-choir5-B1tX3N-I.svg",It="/assets/spem-choir6-uxPhbRis.svg",yt="/assets/spem-choir7-BuGo0Vb-.svg",Rt="/assets/spem-choir8-CsSiFtQI.svg",xt="/assets/spem-Dv8IGMhQ.mp3",St="/assets/spem-1-soprano-5duNMCB9.mp3",wt="/assets/spem-1-alto-DFAFsifc.mp3",At="/assets/spem-1-tenor-D2e84jLc.mp3",_t="/assets/spem-1-baritone-C29FtON9.mp3",Lt="/assets/spem-1-bass-Br-ZvQnm.mp3",Nt="/assets/spem-2-soprano-5iwGFnSI.mp3",Ot="/assets/spem-2-alto-DMgZODPA.mp3",Ct="/assets/spem-2-tenor-CjQGo3CW.mp3",Pt="/assets/spem-2-baritone-DAlABxNG.mp3",Et="/assets/spem-2-bass-MsJm6WaX.mp3",Ft="/assets/spem-3-soprano-IO3c7rRV.mp3",kt="/assets/spem-3-alto-D3wSZojy.mp3",Tt="/assets/spem-3-tenor-CanCNQF7.mp3",Dt="/assets/spem-3-baritone-V60C5mp_.mp3",Bt="/assets/spem-3-bass-YxPNB-JM.mp3",Mt="/assets/spem-4-soprano-DZBx_GOB.mp3",jt="/assets/spem-4-alto-DDue_HXe.mp3",Gt="/assets/spem-4-tenor-Bnrwu1Sf.mp3",Vt="/assets/spem-4-baritone-CCvQ5dHj.mp3",qt="/assets/spem-4-bass-CsMlT5pN.mp3",Ht="/assets/spem-5-soprano-HYeeWW20.mp3",Kt="/assets/spem-5-alto-DqLcqO0d.mp3",Ut="/assets/spem-5-tenor-CiPC0k9V.mp3",$t="/assets/spem-5-baritone-JR27mMMO.mp3",zt="/assets/spem-5-bass-BNenZJg1.mp3",Wt="/assets/spem-6-soprano-BVY9APnp.mp3",Jt="/assets/spem-6-alto-CfNO45EV.mp3",Yt="/assets/spem-6-tenor-7wP35cZm.mp3",Xt="/assets/spem-6-baritone-BI9psMqm.mp3",Qt="/assets/spem-6-bass-CYRY-t3A.mp3",Zt="/assets/spem-7-soprano-4Yk3dkVu.mp3",e2="/assets/spem-7-alto-D9uw_kWC.mp3",n2="/assets/spem-7-tenor-DUa5Xogh.mp3",r2="/assets/spem-7-baritone-BgpdM8Xz.mp3",t2="/assets/spem-7-bass-BXIsB7tg.mp3",s2="/assets/spem-8-soprano-CHxhFGHX.mp3",a2="/assets/spem-8-alto-Dz4eMq8K.mp3",i2="/assets/spem-8-tenor-BkbT7ixO.mp3",c2="/assets/spem-8-baritone-CC7PVpzQ.mp3",o2="/assets/spem-8-bass-BitwelF1.mp3",Zn=[ft,ht,bt,mt,vt,It,yt,Rt],d2=[[St,wt,At,_t,Lt],[Nt,Ot,Ct,Pt,Et],[Ft,kt,Tt,Dt,Bt],[Mt,jt,Gt,Vt,qt],[Ht,Kt,Ut,$t,zt],[Wt,Jt,Yt,Xt,Qt],[Zt,e2,n2,r2,t2],[s2,a2,i2,c2,o2]],nn=.968,y=document.getElementById("spemCanvas");document.getElementById("svgo");const me=document.getElementById("spemScore"),g2=document.getElementById("playpausebutton"),pe=document.getElementById("playpauseicon"),rn=document.getElementById("choir-select"),tn=document.getElementById("part-select"),sn=document.getElementById("bar-field"),xn=document.getElementById("statusarea"),l2=document.getElementById("choir-output"),u2=document.getElementById("part-output"),p2=document.getElementById("bar-output"),f2=document.getElementById("info"),Sn=document.getElementById("help"),He=document.getElementById("backdrop"),wn=document.getElementById("spinner"),fe=document.getElementById("darkswitch"),h2=["soprano","alto","tenor","baritone","bass"];var I=1,W=0,x=0,$,q=new Audio;let A=5,J=0,he=0,z=0;const er=window.matchMedia("(prefers-color-scheme: dark)");er.matches?(document.body.classList.add("dark-theme"),fe.checked=!0):(document.body.classList.remove("dark-theme"),fe.checked=!1);var nr,Ke,rr,an;function Ue(){var r=getComputedStyle(document.body);nr=r.getPropertyValue("--color-background"),r.getPropertyValue("--color-text"),Ke=r.getPropertyValue("--color-highlight"),rr=r.getPropertyValue("--color-score-highlight"),an=[r.getPropertyValue("--color-c1"),r.getPropertyValue("--color-c2"),r.getPropertyValue("--color-c3"),r.getPropertyValue("--color-c4"),r.getPropertyValue("--color-c5"),r.getPropertyValue("--color-c6"),r.getPropertyValue("--color-c7"),r.getPropertyValue("--color-c8")]}function b2(r){return h2[r-1]}async function Q(r){r=Number(r),I!=r&&(I=r,rn.value=I,await fetch(Zn[I-1]).then(e=>e.text()).then(e=>{me.innerHTML=e}).catch(console.error.bind(console)),me.style.borderColor=`hsla(${an[I-1]}, 80%, 55%, 1)`,H(x,!0))}function ve(r){W!=r&&(W=r,tn.value=W)}var Ie;function H(r,e=!1){if(r==x&&!e)return;r>139?(pe.classList.add("paused"),r=0):r<0&&(r=139),x=r,sn.value=x,$=document.getElementsByTagName("svg")[1];var n=document.createElementNS("http://www.w3.org/2000/svg","rect");n.setAttribute("x",ie[I-1][r-1]),n.setAttribute("y","0");const t=r>=138?$.getBBox().width-ie[I-1][137]:ie[I-1][r]-ie[I-1][r-1];n.setAttribute("width",t),n.setAttribute("height",$.getBBox().height),n.style.fill=rr,n.style.fillOpacity=.1,n.style.strokeWidth="5px",$.appendChild(n),Ie!=null&&$.contains(Ie)&&$.removeChild(Ie),Ie=n;var s=3;s=Math.ceil(me.clientWidth/300);var a=0;r>=s&&(a=ie[I-1][r-s]/$.getBBox().width*$.getBoundingClientRect().width),console.log("scrolling to bar "+r+" at "+a,ie[I-1][r-s],$.getBBox().width,$.getBoundingClientRect().width),me.scrollTo({top:0,left:a,behavior:"smooth"})}function m2(){const e=window.location.search.substring(1).split("&");for(let n=0;n<e.length;n++){const t=e[n].split("=");t[0]=="choir"?I=Number(t[1]):t[0]=="part"?W=Number(t[1]):t[0]=="bar"&&(x=Number(t[1]))}Q(I),ve(W),H(x)}function v2(){y.width=y.clientWidth*4,y.height=300*2,J=(y.width-2*A)/140,he=(y.height-2*A)/8,z=he/5}function I2(){const r=y.getContext("2d");r.save(),r.font="30px Arial",r.fillStyle="white",r.scale(y.width/y.height,1),r.fillText("Loading...",0,y.height/2),r.restore()}var Se=[];for(var ye=0;ye<8;ye++){Se[ye]=[];for(var Pe=0;Pe<5;Pe++)Se[ye][Pe]=1}function y2(r=0){const e=Math.floor(r),n=Math.floor(r*16)/16,t=ce[n];if(t!=null&&t.length>0)for(var s of t)Se[s.c][s.p]=R2(r%n,1.4,-.4,s.n.duration.sfths/128);H(e)}function R2(r,e,n,t){return n*((r=r/t-1)*r*r+1)+e}function tr(r){r==null&&(r=x);const e=y.getContext("2d");e.fillStyle=nr,e.fillRect(0,0,y.width,y.height),x>0&&x<=139&&(e.save(),e.beginPath(),e.moveTo(A+x*J,A),e.lineTo(A+x*J,y.height-A),e.lineWidth=J*1.4,e.strokeStyle=Ke,e.lineCap="square",e.stroke(),e.restore());var n,t;W!=0?(n=A+(I-1)*he+(W-1)*z,t=z*1.4):(n=A+(I-1)*he+2*z,t=z*5.8),e.save(),e.beginPath(),e.moveTo(A+J,n+z/2),e.lineTo(A+140*J-J,n+z/2),e.lineWidth=t,e.strokeStyle=Ke,e.lineCap="round",e.stroke(),e.restore(),e.lineWidth=.9*z,e.lineCap="round";for(let s=0;s<8;s++)for(let a=0;a<5;a++){const i=A+s*he+a*z;ue[s][a].forEach(o=>{const l=o.from,c=o.to;e.beginPath();const d=A+(l+.3)*J,u=A+(c-.3)*J,p=i+z/2;e.moveTo(d,p),e.lineTo(u,p);var h,m,v;r>=l&&r<c?(m=80,h=(67-3*a)*Se[s][a],v=1):s==I-1&&(W==0||a==W-1)?(m=80,h=67-3*a,v=1):x===0||x>138?(m=50,h=67-3*a,v=1):(m=50,h=67-3*a,v=.5),e.strokeStyle=`hsla(${an[s]}, ${m}%, ${h}%, ${v})`,e.stroke()})}}function sr(r,e){const n=r.getBoundingClientRect(),t=e.offsetY*8/n.height;return[Math.floor(t+1),Math.floor(t%1*5+1),Math.floor(e.offsetX*140/n.width)]}function An(r){return r.split("/").pop()}function x2(r,e,n){let t=xt;r!="0"&&e!="0"&&(t=d2[r-1][e-1]),An(t)!=An(q.currentSrc)&&(q.src=t,q.load()),q.currentTime=n*4*nn}async function ar(){q.paused&&(pe.style.display="none",wn.style.display="block",await q.play(),pe.style.display="block",wn.style.display="none",pe.classList.remove("paused"),window.requestAnimationFrame(ir))}function ir(r){const e=q.currentTime/(nn*4);y2(e),tr(e),e>=140?(H(0),q.currentTime=0,cn()):q.paused||window.requestAnimationFrame(ir)}function cn(){q.paused||(q.pause(),pe.classList.add("paused"))}function cr(){q.paused?ar():cn()}function S2(r){const[e,n,t]=sr(y,r);Q(e),ve(n),H(t),_(),ar()}let _n=0;function w2(r){const[e,n,t]=sr(y,r);l2.textContent="Choir "+e,u2.textContent=b2(n),p2.textContent="Bar "+t,xn.classList.remove("hide"),clearInterval(_n),_n=setInterval(function(){xn.classList.add("hide")},1500)}function A2(){Q(rn.value),ve(tn.value),H(sn.value),q.currentTime=x*4*nn,_(!1)}function _(r=!0){cn(),r&&x2(I,W,x),tr()}function _2(r){if(![...r.target.classList].includes("control")&&!(r.isComposing||r.keyCode===229)){if(r.metaKey||r.ctrlKey){switch(console.log("meta or ctrl pressed"),r.code){case"ArrowRight":H(On(x,1)),_();break;case"ArrowLeft":H(On(x,-1)),_();break}return}if(r.code=="Enter"){cr();return}switch(r.code){case"Digit1":case"Digit2":case"Digit3":case"Digit4":case"Digit5":case"Digit6":case"Digit7":case"Digit8":Q(r.key),_();break;case"KeyS":case"KeyA":case"KeyT":case"KeyR":case"KeyB":ve("satrb".indexOf(r.key)+1),_();break;case"ArrowRight":H(x+1),_(),r.preventDefault();break;case"ArrowLeft":H(x-1),_(),r.preventDefault();break;case"ArrowDown":Q(I==8?1:I+1),_();break;case"ArrowUp":Q(I==1?8:I-1),_();break;case"KeyX":ve(0),_();break}}}function Ln(r){var e=y.getBoundingClientRect(),n=Math.ceil(8*((r.targetTouches[0].clientY-e.top-A)/(y.clientHeight-2*A)));n=Math.min(Math.max(1,n),8);var t=Math.round(140*((r.targetTouches[0].clientX-e.left-A)/(y.clientWidth-2*A)));return t=Math.min(Math.max(0,t),139),[n,t]}function L2(r){const[e,n]=Ln(r);Q(e),H(n),_(!1),r.preventDefault(),y.addEventListener("touchmove",t=>{const[s,a]=Ln(t);Q(s),H(a),_(!1)}),y.addEventListener("touchend",()=>{_()})}function Nn(r=!0){r?(He.style.display="block",Sn.style.display="block"):(He.style.display="none",Sn.style.display="none")}function N2(){er.matches?document.body.classList.toggle("light-theme"):document.body.classList.toggle("dark-theme"),Ue(),_()}function On(r,e){const t=ce[r].filter(a=>a.c==I-1).length!=0;var s=!1;do{r=r+e;const a=ce[r].filter(i=>i.c==I-1).length!=0;s=t!=a}while(!s&&r>0&&r<139);return r}function Cn(){let r=window.innerHeight*.01;document.documentElement.style.setProperty("--vh",`${r}px`)}window.addEventListener("load",async()=>{Cn(),Ue(),v2(),I2(),await fetch(Zn[0]).then(r=>r.text()).then(r=>{me.innerHTML=r}).catch(console.error.bind(console)),await lt(),await ut(pt),m2(),_(),g2.addEventListener("click",cr),y.addEventListener("click",S2),y.addEventListener("mousemove",w2,!1),[rn,tn,sn].forEach(r=>r.addEventListener("change",A2)),document.addEventListener("keydown",_2),y.addEventListener("touchstart",L2,{passive:!1}),f2.addEventListener("click",()=>Nn(!0)),He.addEventListener("click",()=>Nn(!1)),fe.addEventListener("click",()=>N2()),window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",()=>{fe.checked=!fe.checked,Ue(),_()}),window.addEventListener("resize",()=>Cn())});
