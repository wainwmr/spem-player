/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// Make an dictionary of music positions (hemidemisemiquavers/128) to array of notes {choir, part, note}
const dict = {};

// a dictionary to hold the muic in the lilypond input file
var scores = {};



// TODO: Perhaps locations = { json: <String>, defaultaudio: <String>, audio: <String>[8][5] }?
const defaultaudiofile = '/audio/spem.mp3';
const lilypondfile = '/lilypond/spem notes.ly';

// const beattime = 0.967; // old
// (minim = 124) === (beattime = 0.9677)
const beattime = 0.968;

// const container = document.getElementById("spemFrame");
const canvas = document.getElementById("spemCanvas");
const svgobject = document.getElementById("svgo");
const spemscore = document.getElementById("spemScore");
const playpausebutton = document.getElementById('playpausebutton');
const playpauseicon = document.getElementById('playpauseicon');
const choirselect = document.getElementById('choir-select');
const partselect = document.getElementById('part-select');
const barinput = document.getElementById('bar-field');
const statusarea = document.getElementById('statusarea');
const choiroutput = document.getElementById('choir-output');
const partoutput = document.getElementById('part-output');
const baroutput = document.getElementById('bar-output');
const info = document.getElementById('info');
const help = document.getElementById('help');
const backdrop = document.getElementById('backdrop');
const spinner = document.getElementById('spinner');
const darkswitch = document.getElementById('darkswitch');

const allparts = ['soprano', 'alto', 'tenor', 'baritone', 'bass']; // HACK: this is repeasted later

// State
var currentChoir = 1;  // from 1 to 8
var currentPart = 0;  // 0 means All parts; 1 is Soprano... 5 is Bass
var currentBar = 0;
var svg; // the actual SVG
var spemaudio = new Audio();



let canvasPadding = 5;  // padding in px of the canvas

let barWidth = 0;
let choirHeight = 0;
let partHeight = 0;

const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
if (prefersDarkScheme.matches) {
  document.body.classList.add('dark-theme');
  darkswitch.checked = true;
} else {
  document.body.classList.remove('dark-theme');
  darkswitch.checked = false;
}

// All the colors are defined in the style sheet
var backgroundColor, textColor, highlightColor, choirColors;
function loadColors() {
  var style = getComputedStyle(document.body);
  backgroundColor = style.getPropertyValue('--color-background');
  textColor = style.getPropertyValue('--color-text');
  highlightColor = style.getPropertyValue('--color-highlight');
  scoreHighlightColor = style.getPropertyValue('--color-score-highlight');
  choirColors = [
    style.getPropertyValue('--color-c1'),
    style.getPropertyValue('--color-c2'),
    style.getPropertyValue('--color-c3'),
    style.getPropertyValue('--color-c4'),
    style.getPropertyValue('--color-c5'),
    style.getPropertyValue('--color-c6'),
    style.getPropertyValue('--color-c7'),
    style.getPropertyValue('--color-c8')
  ];
}

function getPartName(n) {
  return allparts[n - 1];
}


// TODO: Choir 6 Alto
// TODO: Choir 6 Tenor
// TODO: Choir 6 Baritone
// TODO: Choir 6 Bass
// TODO: Choir 7 Soprano
// TODO: Choir 7 Alto
// TODO: Choir 7 Tenor
// TODO: Choir 7 Baritone
// TODO: Choir 7 Bass
// TODO: Choir 8 Soprano
// TODO: Choir 8 Alto
// TODO: Choir 8 Tenor
// TODO: Choir 8 Baritone
// TODO: Choir 8 Bass

// TODO: minimise SVGs in build process
// TODO: minimse SVGs using <use> and <defs> elements
// TODO:  when music ends, should show canvas highlighted again
// TODO: add bar 138 1/2?? like the audio?
// TODO: click on score should send you to bar.  And part?
// BUG: when page is narrow, showing 2 previous bars is uncomfortable/wrong
// TODO: Change dark mode to moon/sun icons
// TODO: Add hide/show icon to remove score
// TODO: Visual effect for false relations
// TODO: switching dark mode should not stop play
// TODO: Better font/graphic for Spem Player title
// BUG: Kinsta not loading spem notes.ly for some reason
// BUG: can scroll up and down a tiny bit in score
// BUG: [Violation] Forced reflow while executing JavaScript took 36ms  (this doesn't happen when you have already manually adjusted the height of the score - something to do with the flex: 1 after the reload?)
// BUG: should scroll to current bar whenever you change scores
// BUG: Uncaught DOMException: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node. at setBar:239
// BUG: When clicking on canvas, should highlight bar (call setBar maybe?)
// TODO: put build process in script (generate SVGs, get scorebars, minimise, rename and move...)
// TODO: up and down arrows to select different choirs
// TODO: CMD-B to type in bar number
// TODO: CMD-left/right to skip to next interesting bit for choir or part
// TODO: highlight part on score?
// TODO: Add lyrics to footer

const scorebars = [
  [4.2888, 22.9514, 40.2649, 58.3664, 74.5154, 94.0865, 115.9832, 136.0011, 163.4127, 186.6976, 207.6535, 237.6242, 264.8988, 290.9424, 314.6237, 341.2594, 374.2127, 407.1140, 440.2038, 466.8086, 494.9784, 524.4120, 549.3313, 577.9856, 596.2399, 607.3775, 625.0738, 642.7700, 660.4663, 678.1626, 695.8588, 713.5551, 731.2514, 748.9477, 766.6439, 784.3402, 802.0365, 819.7328, 837.4290, 855.1253, 877.9822, 906.5289, 937.2837, 963.7545, 990.7528, 1016.4317, 1034.1280, 1051.8243, 1069.5206, 1087.2168, 1104.9131, 1122.6094, 1140.3057, 1158.0019, 1175.6982, 1193.3945, 1211.0907, 1228.7870, 1246.4833, 1264.1796, 1281.8758, 1299.5721, 1317.2684, 1334.9647, 1352.6609, 1363.7985, 1384.4866, 1401.9511, 1422.7716, 1439.9551, 1465.6022, 1494.4879, 1528.9910, 1562.5759, 1584.6081, 1613.4801, 1635.5700, 1653.2663, 1670.9626, 1688.6589, 1706.3551, 1726.3203, 1758.7166, 1789.5014, 1806.1660, 1828.1849, 1855.6605, 1877.5872, 1891.7013, 1909.3976, 1927.0939, 1943.9704, 1963.5169, 1980.7738, 2000.8055, 2024.7369, 2042.4332, 2060.1294, 2077.8257, 2095.5220, 2114.3190, 2140.9869, 2165.7129, 2185.7291, 2207.0080, 2232.0004, 2259.6932, 2289.5898, 2309.6692, 2326.8858, 2343.3995, 2361.0957, 2378.7920, 2396.4883, 2414.1846, 2431.8808, 2449.5771, 2463.6061, 2490.2068, 2512.5056, 2540.3123, 2556.8538, 2576.7439, 2598.5200, 2612.6010, 2638.9076, 2666.1492, 2693.6033, 2720.5802, 2745.5274, 2773.4160, 2794.1955, 2819.1918, 2847.9661, 2875.3204, 2900.2807, 2932.2176, 2951.2181,],
  [4.2888, 27.1995, 44.3851, 61.5706, 72.5021, 89.6132, 107.8621, 126.9038, 144.4869, 163.9647, 186.3113, 210.8133, 233.7712, 260.0785, 290.7653, 317.1741, 339.1492, 365.2730, 391.8674, 424.7085, 454.6030, 483.8951, 509.7968, 540.0255, 569.3826, 585.4356, 602.6211, 619.8067, 636.9923, 654.1778, 671.3634, 688.5489, 705.7345, 722.9201, 740.1056, 757.2912, 774.4767, 791.6623, 808.8479, 826.0334, 845.4506, 869.5375, 896.2277, 925.1234, 954.4371, 983.1067, 996.9375, 1014.1230, 1031.3086, 1048.4942, 1065.6797, 1082.8653, 1100.0508, 1117.2364, 1134.4220, 1151.6075, 1168.7931, 1185.9787, 1203.1642, 1220.3498, 1237.5353, 1254.7209, 1271.9065, 1289.0920, 1306.2776, 1317.2090, 1332.3373, 1348.9598, 1365.2841, 1380.5192, 1403.4792, 1426.6641, 1456.9346, 1490.8460, 1519.2560, 1547.8355, 1563.9295, 1581.1151, 1598.3006, 1615.4862, 1632.6718, 1658.1867, 1690.6612, 1727.3217, 1750.0550, 1774.7557, 1804.7092, 1830.5159, 1847.7015, 1864.8871, 1882.0726, 1909.1899, 1925.3942, 1949.3082, 1975.8943, 1995.6081, 2012.7937, 2029.9792, 2047.1648, 2064.3503, 2083.0278, 2115.7475, 2143.0031, 2164.9205, 2187.3464, 2215.9211, 2245.4086, 2274.6898, 2299.3134, 2317.1650, 2328.0964, 2345.2820, 2362.4676, 2379.6531, 2396.8387, 2414.0243, 2427.8688, 2452.6033, 2481.5437, 2504.7565, 2530.4057, 2550.2436, 2560.7623, 2574.9700, 2598.3599, 2622.7297, 2649.1551, 2676.8446, 2702.3617, 2731.2389, 2765.1987, 2792.8004, 2816.9069, 2842.1979, 2872.1325, 2902.3866, 2929.0327, 2951.3577,],
  [4.2888, 28.0428, 46.0716, 64.1004, 82.1292, 100.1580, 118.1868, 136.2156, 154.2444, 172.2732, 190.3020, 204.3605, 221.9530, 240.0970, 261.7405, 286.0191, 310.8146, 332.8455, 363.8863, 396.6013, 422.4062, 452.1530, 476.9008, 501.1038, 529.4270, 551.2206, 569.2494, 587.2782, 605.3070, 623.3358, 641.3646, 659.3934, 677.4222, 695.4510, 713.4798, 727.6380, 748.0723, 775.9510, 792.8208, 810.8496, 834.4273, 861.6297, 886.2183, 915.2006, 940.0794, 964.6657, 981.1544, 999.1832, 1017.2120, 1035.2408, 1053.2696, 1071.2984, 1089.3272, 1107.3560, 1125.3848, 1143.4136, 1161.4424, 1177.7730, 1199.3222, 1224.5296, 1249.0699, 1271.8237, 1296.8414, 1324.2120, 1357.9806, 1365.8451, 1383.8739, 1401.9027, 1419.9315, 1433.9050, 1463.7359, 1487.4786, 1514.0997, 1544.6560, 1567.6921, 1595.1355, 1621.9709, 1639.9997, 1658.0285, 1676.0573, 1694.0861, 1712.1149, 1730.1438, 1748.1726, 1766.6777, 1783.4141, 1816.8891, 1838.7763, 1866.4702, 1886.2876, 1913.8208, 1935.0836, 1953.1124, 1971.1412, 1989.1700, 2007.1988, 2033.1076, 2057.5793, 2087.8408, 2104.4607, 2122.4895, 2140.5183, 2158.5471, 2176.5759, 2200.0775, 2224.6382, 2250.2523, 2279.2948, 2297.1253, 2317.9527, 2331.9584, 2349.9872, 2368.0160, 2382.0387, 2406.1715, 2430.0466, 2456.9513, 2480.2436, 2494.6518, 2512.6806, 2530.7094, 2548.7382, 2565.9914, 2587.6284, 2608.4742, 2632.2515, 2659.3490, 2688.1108, 2708.3988, 2734.3162, 2766.1314, 2789.9996, 2816.5068, 2845.8377, 2871.4396, 2898.4143, 2924.8945, 2951.1271,],
  [5.5588, 29.5785, 47.8730, 66.1675, 84.4620, 102.7565, 121.0510, 139.3455, 157.6400, 175.9345, 194.2290, 212.5235, 230.8180, 249.1125, 267.4070, 285.7015, 299.9542, 317.6845, 341.0178, 362.9688, 381.8150, 403.9461, 424.3494, 446.7551, 474.4053, 502.7978, 532.1526, 554.2573, 565.6364, 583.9309, 602.2254, 620.5199, 638.8144, 657.1089, 675.4034, 689.7497, 708.8000, 734.4538, 757.1405, 775.4350, 798.7990, 823.9787, 849.6067, 878.4917, 910.0929, 934.5709, 953.4743, 971.7688, 990.0633, 1008.3578, 1026.6523, 1044.9468, 1063.2413, 1081.5358, 1099.8303, 1118.1248, 1132.3032, 1150.2273, 1173.3462, 1200.8064, 1228.6017, 1256.1983, 1279.7608, 1311.4469, 1349.3481, 1374.3981, 1392.6926, 1410.9871, 1429.2816, 1443.8700, 1467.4037, 1499.1215, 1530.1262, 1561.5383, 1590.8146, 1619.4373, 1636.1212, 1654.4157, 1672.7102, 1691.0047, 1709.2992, 1727.5937, 1745.8882, 1764.1827, 1786.9434, 1801.4679, 1830.3287, 1851.6595, 1869.1310, 1886.1952, 1903.6291, 1920.6654, 1938.9599, 1957.2544, 1975.5489, 1993.8434, 2011.4643, 2033.9798, 2062.3475, 2076.9045, 2095.1990, 2113.4935, 2131.7880, 2150.0825, 2179.3738, 2206.0215, 2232.3798, 2259.7780, 2280.0219, 2304.6570, 2316.0360, 2334.3305, 2352.6250, 2370.9195, 2391.1399, 2420.6948, 2451.0698, 2472.5828, 2489.7597, 2508.0542, 2526.3487, 2544.6432, 2555.5988, 2578.2156, 2604.5963, 2628.6329, 2653.9388, 2681.4879, 2706.9076, 2734.2057, 2762.9283, 2792.3107, 2822.6110, 2847.7301, 2876.6984, 2903.7287, 2933.5155, 2951.0545,],
  [4.2888, 28.5960, 47.1781, 65.7602, 84.3423, 102.9244, 121.5064, 140.0885, 158.6706, 177.2527, 195.8348, 214.4169, 232.9990, 251.5810, 270.1631, 288.7452, 307.3273, 325.9094, 344.4915, 363.0735, 381.6556, 400.2377, 418.8198, 436.8101, 454.5611, 473.7979, 497.0290, 518.8599, 546.5898, 571.3767, 598.4486, 621.5635, 644.1365, 666.1308, 689.6513, 703.8870, 722.4690, 741.0511, 759.6332, 778.2153, 802.0382, 824.6080, 853.2548, 882.8011, 909.6314, 935.6007, 952.8368, 971.4189, 990.0010, 1008.5831, 1026.9548, 1049.8791, 1077.9510, 1097.0077, 1121.4740, 1145.4938, 1177.4484, 1206.3066, 1230.7567, 1252.9651, 1267.5626, 1286.1447, 1304.7268, 1323.3088, 1341.8909, 1360.4730, 1379.0551, 1397.6372, 1416.2193, 1438.0338, 1463.9371, 1491.1261, 1520.2724, 1553.6470, 1583.4894, 1614.3372, 1640.3340, 1654.7336, 1679.5038, 1703.2841, 1733.0218, 1752.9885, 1771.5706, 1790.1527, 1808.7348, 1825.4075, 1851.3182, 1884.5356, 1902.3130, 1920.8951, 1939.4772, 1958.0593, 1976.6414, 1995.2234, 2013.8055, 2028.3568, 2046.3023, 2071.2737, 2095.7303, 2115.1582, 2141.4060, 2164.4696, 2183.0517, 2201.6338, 2220.2159, 2238.7980, 2257.3801, 2275.9621, 2290.3942, 2310.4982, 2333.5401, 2352.8027, 2376.8947, 2395.9803, 2410.9197, 2429.5018, 2448.0839, 2466.6660, 2485.2480, 2503.8301, 2522.4122, 2540.9943, 2566.2677, 2596.5868, 2613.4860, 2636.7911, 2663.7407, 2689.7711, 2719.6218, 2745.4654, 2772.2802, 2803.6363, 2829.0013, 2858.8954, 2887.8446, 2915.8535, 2942.9601, 2950.9758,],
  [1.4846, 21.6116, 36.0135, 50.4154, 63.6897, 83.5860, 103.9603, 125.3876, 145.3090, 167.1595, 190.7762, 216.6967, 241.9143, 269.7093, 301.2162, 329.2269, 353.5704, 381.5153, 409.6635, 443.0545, 474.0685, 504.3100, 531.6883, 563.1545, 593.7703, 612.1766, 626.5785, 640.9804, 655.3822, 669.7841, 684.1860, 698.5879, 712.9898, 727.3917, 741.7936, 756.1955, 770.5974, 784.9993, 799.4012, 813.8031, 835.7879, 861.8438, 890.4674, 920.7525, 951.0156, 980.5161, 996.9143, 1011.3161, 1025.7180, 1040.1199, 1054.5218, 1068.9237, 1083.3256, 1097.7275, 1112.1294, 1126.5313, 1140.9332, 1155.3351, 1169.7370, 1184.1389, 1198.5408, 1212.9427, 1227.3446, 1241.7465, 1256.1484, 1269.4227, 1287.2398, 1306.6473, 1325.5852, 1343.2756, 1368.4953, 1393.7292, 1425.6213, 1460.2100, 1490.5461, 1520.5295, 1538.9805, 1553.3824, 1567.7843, 1582.1862, 1596.5881, 1623.5095, 1655.9980, 1691.5428, 1715.2377, 1742.2727, 1773.2243, 1800.0873, 1814.4892, 1828.8911, 1843.2930, 1871.5850, 1890.1501, 1915.8846, 1944.0737, 1966.3695, 1980.7714, 1995.1733, 2009.5752, 2023.9770, 2044.6161, 2077.3010, 2106.4901, 2130.7720, 2154.0147, 2183.8669, 2214.2482, 2244.6540, 2270.7069, 2290.7587, 2304.0331, 2318.4350, 2332.8369, 2347.2388, 2361.6407, 2376.0425, 2392.4511, 2419.3366, 2449.5544, 2475.0270, 2502.5509, 2524.2528, 2536.9324, 2553.6309, 2579.2727, 2605.7895, 2633.9291, 2663.2240, 2690.1803, 2720.4614, 2753.5483, 2782.8625, 2809.1199, 2836.2225, 2866.8903, 2897.6583, 2925.5686, 2949.3822,],
  [1.4846, 22.2724, 37.3351, 52.3978, 67.4605, 82.5232, 97.5859, 112.6486, 127.7113, 142.7740, 157.8367, 174.5534, 195.0406, 215.4710, 239.0446, 264.9427, 291.3771, 315.3901, 347.6105, 380.7071, 408.0847, 438.5571, 464.4615, 490.2882, 520.1569, 544.5015, 559.5642, 574.6269, 589.6896, 604.7523, 619.8150, 634.8777, 649.9404, 665.0031, 680.0658, 696.8823, 719.9877, 749.3597, 768.6750, 783.7377, 809.3155, 838.0870, 864.6420, 894.8288, 921.6224, 947.7640, 966.4929, 981.5556, 996.6183, 1011.6810, 1026.7437, 1041.8064, 1056.8691, 1071.9318, 1086.9945, 1102.0572, 1117.1199, 1135.8769, 1159.6676, 1186.8848, 1213.4348, 1238.5040, 1265.7294, 1294.3130, 1328.0421, 1337.9613, 1353.0240, 1368.0867, 1383.1494, 1399.5913, 1430.1361, 1456.1782, 1484.4909, 1516.1479, 1541.3978, 1570.6518, 1598.5366, 1613.5993, 1628.6620, 1643.7247, 1658.7874, 1673.8501, 1688.9128, 1703.9755, 1725.2486, 1744.4306, 1778.3473, 1801.4664, 1830.2850, 1852.7736, 1881.4315, 1905.2495, 1920.3122, 1935.3749, 1950.4376, 1965.5003, 1993.1782, 2019.6099, 2050.3555, 2069.4210, 2084.4837, 2099.5464, 2114.6091, 2129.6718, 2155.3008, 2182.0502, 2209.6232, 2240.1149, 2260.8483, 2283.9467, 2300.6255, 2315.6882, 2330.7509, 2347.4319, 2373.8801, 2400.0705, 2428.4857, 2453.6361, 2470.7026, 2485.7653, 2500.8280, 2515.8907, 2535.8570, 2559.9920, 2583.3740, 2609.4666, 2638.3114, 2667.9546, 2690.8315, 2718.6121, 2751.3013, 2777.4931, 2806.0921, 2836.4053, 2864.1850, 2892.4236, 2920.7820, 2949.0724,],
  [1.4846, 22.5188, 37.8279, 53.1370, 68.4461, 83.7552, 99.0643, 114.3734, 129.6826, 144.9917, 160.3008, 175.6099, 190.9190, 206.2281, 221.5372, 236.8463, 253.8177, 274.5150, 299.6407, 324.0967, 345.7974, 370.1235, 393.2647, 417.9815, 447.2435, 477.5440, 508.5639, 533.1283, 546.9932, 562.3023, 577.6114, 592.9205, 608.2296, 623.5387, 638.8478, 655.9129, 677.8178, 705.2124, 730.3844, 745.6935, 771.2877, 798.7388, 826.4039, 856.4467, 888.1046, 914.6203, 935.3099, 950.6190, 965.9281, 981.2372, 996.5463, 1011.8554, 1027.1645, 1042.4736, 1057.7827, 1073.0918, 1089.9889, 1110.8759, 1136.4952, 1165.5275, 1194.9964, 1224.1650, 1249.9333, 1282.6085, 1319.1142, 1345.9348, 1361.2439, 1376.5530, 1391.8621, 1409.1693, 1434.8455, 1467.7201, 1500.3489, 1533.1002, 1564.4671, 1594.5019, 1613.6749, 1628.9840, 1644.2931, 1659.6022, 1674.9113, 1690.2204, 1705.5295, 1720.8386, 1745.8390, 1763.0975, 1792.9900, 1816.8450, 1837.0748, 1856.6439, 1876.8361, 1896.3774, 1911.6865, 1926.9956, 1942.3047, 1957.6138, 1978.1864, 2003.1872, 2033.3476, 2050.6428, 2065.9519, 2081.2610, 2096.5701, 2111.8792, 2142.0238, 2170.5725, 2199.1184, 2228.5354, 2251.5172, 2278.5126, 2292.3775, 2307.6866, 2322.9957, 2338.3048, 2361.2437, 2391.6670, 2422.8966, 2447.0266, 2466.6964, 2482.0055, 2497.3146, 2512.6237, 2525.8716, 2550.9626, 2579.0236, 2605.4400, 2632.4262, 2661.5802, 2689.2132, 2718.3519, 2748.5151, 2779.4164, 2811.0554, 2838.4460, 2868.8697, 2897.8220, 2928.9476, 2948.9569,],
];

// function getViewBox(bar, width) {
//   const ideal = 0.3;
//   var left = Math.max(scorebars[0], scorebars[bar - 1] - (width * ideal));
//   var right = Math.min(scorebars[137], scorebars[bar - 1] + (width * (1 - ideal)));
//   if (left > scorebars[137] - width) {
//     left = scorebars[137] - width;
//   }
//   if (right < scorebars[0] + width) {
//     right = scorebars[0] + width;
//   }
//   return `${left - 5} 0 ${right - left} 55`;
// }

// var svg;
var pt;

function scoreClicked(e) {
  console.log("score clicked");
  pt.x = e.clientX;
  pt.y = e.clientY;

  // The cursor point, translated into svg coordinates
  var cursorpt = pt.matrixTransform(svg.getScreenCTM().inverse());
  console.log("(" + cursorpt.x + ", " + cursorpt.y + ")");

  var result = scorebars.find(x => x > cursorpt.x);
  console.log(scorebars.indexOf(result));
  setBar(scorebars.indexOf(result));
}

// where c = 1 to 8
function setChoir(c) {
  c = Number(c);
  if (currentChoir == c) {
    return;
  }
  currentChoir = c;

  // Update the input field
  choirselect.value = currentChoir;

  // Load the new SVG score
  svgobject.setAttribute("data", `/svg/spem-choir${c}.svg`);
  const subdoc = svgobject.getSVGDocument();
  svg = subdoc.getElementsByTagName("svg")[0];
  svgobject.addEventListener("click", scoreClicked);

  // set the border color to match
  spemscore.style.borderColor = `hsla(${choirColors[currentChoir - 1]}, 80%, 55%, 1)`;

  // scroll the score to match the new choir
  setBar(currentBar);
}

// where p = 0 (for all parts) or 1 - 5 for SATBarB
function setPart(p) {
  if (currentPart == p) {
    return;
  }
  currentPart = p;

  // Update the input field
  partselect.value = currentPart
}


var previousBarHighlight;

// where b = 0 to 139
function setBar(b) {
  console.log("setBar: ", b);
  // if (b == currentBar) {
  //   return;
  // }
  if (b > 139) {
    playpauseicon.classList.add("paused");
    b = 0;
  }
  else if (b < 0) {
    b = 139;
  }
  currentBar = b;

  // update the input field
  barinput.value = currentBar;

  const subdoc = svgobject.getSVGDocument();
  svg = subdoc.getElementsByTagName("svg")[0];
  // pt = svg.createSVGPoint();  // HACK: Created once for document

  // Highlight the current bar on the score
  var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
  newElement.setAttribute("x", scorebars[currentChoir - 1][b - 1]);
  newElement.setAttribute("y", "0");
  const bw = (b >= 138 ? svg.getBBox().width - scorebars[currentChoir - 1][137] : scorebars[currentChoir - 1][b] - scorebars[currentChoir - 1][b - 1]);
  newElement.setAttribute("width", bw);
  newElement.setAttribute("height", svg.getBBox().height);
  newElement.style.fill = scoreHighlightColor; //Set stroke colour
  newElement.style.fillOpacity = 0.1;
  newElement.style.strokeWidth = "5px"; //Set stroke width
  svg.appendChild(newElement);

  if (previousBarHighlight != undefined) {
    if (svg.contains(previousBarHighlight)) {
      svg.removeChild(previousBarHighlight);
    }
  }
  previousBarHighlight = newElement;

  // scroll to current bar
  var pos = 0;
  if (b > 2) {
    pos = (scorebars[currentChoir - 1][b - 3] / svg.getBBox().width) * svg.getBoundingClientRect().width;
  }

  console.log("scrolling to bar " + b + " at " + pos, scorebars[currentChoir - 1][b - 3], svg.getBBox().width, svg.getBoundingClientRect().width);
  spemscore.scrollTo({
    top: 0,
    left: pos, //b * scorebarwidth,
    behavior: "smooth"
  });
}

function parseURL() {
  const url = window.location.search.substring(1);
  const parms = url.split("&");

  for (let i = 0; i < parms.length; i++) {
    const p = parms[i].split("=");
    if (p[0] == "choir") {
      currentChoir = Number(p[1]);
    }
    else if (p[0] == "part") {
      currentPart = Number(p[1]);
    }
    else if (p[0] == "bar") {
      currentBar = Number(p[1]);
    }
  }
  setChoir(currentChoir);
  setPart(currentPart);
  setBar(currentBar);
}

function calculateCanvasSize() {
  canvas.width = canvas.clientWidth * 4;
  canvas.height = 300 * 2;

  barWidth = (canvas.width - (2 * canvasPadding)) / 140;
  choirHeight = (canvas.height - (2 * canvasPadding)) / 8;
  partHeight = choirHeight / 5;

  // console.log(`calculateCanvasSize(): canvas.width= ${canvas.width}, canvas.height=${canvas.height}, barWidth=${barWidth}, choirHeight=${choirHeight}, partHeight=${partHeight}`)

  // changed = true;
}

function showLoadingOnCanvas() {
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.font = "30px Arial";
  ctx.fillStyle = "white";
  ctx.scale(canvas.width / canvas.height, 1);
  ctx.fillText(`Loading...`, 0, canvas.height / 2);
  ctx.restore();
}

// define array pulses[choir][part] to be min transparency which
// will be pulsed when the choir is singing a note.
var pulses = [];
for (var c = 0; c < 8; c++) {
  pulses[c] = [];
  for (var p = 0; p < 5; p++) {
    pulses[c][p] = 1;
  }
}

function update(pos = 0) {

  const bar = Math.floor(pos);

  const duration = 0.5;

  // find who has a note that starts in this current quaver (16th of a bar)
  const quant = Math.floor(pos * 16) / 16;
  const notes = dict[quant];

  // 
  if (notes != undefined && notes.length > 0) {
    for (var n of notes) {
      pulses[n.c][n.p] = easeOutCubic(pos % quant, 1.4, -0.4, n.n.duration.sfths / 128);
    }
  }

  setBar(bar);
}

function easeInCubic(t, b, c, d) {
  return c * (t /= d) * t * t + b;
}

function easeOutCubic(t, b, c, d) {
  return c * ((t = t / d - 1) * t * t + 1) + b;
}

function easeOutQuad(t, b, c, d) {
  return -c * (t /= d) * (t - 2) + b;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.stroke();
}

function draw(currentpos) {

  if (currentpos == undefined) {
    currentpos = currentBar;
  }

  // if (!changed || barWidth === 0) {
  //   return;
  // }
  // changed = false;

  // Blank out the whole canvas
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw FPS number to the screen
  // if (!isNaN(fps)) {
  //   ctx.font = '25px Arial';
  //   ctx.fillStyle = '#CCC';
  //   ctx.fillText("FPS: " + fps, 10, canvas.height - 30);
  // }

  // Draw bar highlight
  // roundedRect(ctx, canvasPadding + (currentBar * barWidth), canvasPadding, barWidth, canvas.height - canvasPadding, 10);
  if (currentBar > 0 && currentBar <= 139) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(canvasPadding + (currentBar * barWidth), canvasPadding);
    ctx.lineTo(canvasPadding + (currentBar * barWidth), canvas.height - canvasPadding);
    ctx.lineWidth = barWidth * 1.4;
    ctx.strokeStyle = highlightColor;
    ctx.lineCap = "square";
    ctx.stroke();
    ctx.restore();
  }


  // Draw highlight line for the selected choir or choir and part
  var startY, width;
  if (currentPart != 0) {
    startY = canvasPadding + ((currentChoir - 1) * choirHeight) + ((currentPart - 1) * partHeight);
    width = partHeight * 1.4;
  }
  else {
    // center the highlight on the middle tenor line
    startY = canvasPadding + ((currentChoir - 1) * choirHeight) + (2 * partHeight);
    width = (partHeight * 5.8);
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(canvasPadding + barWidth, startY + (partHeight / 2));
  ctx.lineTo(canvasPadding + (140 * barWidth) - barWidth, startY + (partHeight / 2));
  ctx.lineWidth = width;
  ctx.strokeStyle = highlightColor;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.restore();

  // Draw each of the 40 voice parts
  ctx.lineWidth = 0.9 * partHeight;
  ctx.lineCap = "round";
  for (let c = 0; c < 8; c++) {
    for (let p = 0; p < 5; p++) {
      const startY = canvasPadding + (c * choirHeight) + (p * partHeight);

      const list = ranges[c][p];
      list.forEach(r => {
        const from = r.from;
        const to = r.to;

        ctx.beginPath();
        // The weird 0.3 is because we're using rounded lines
        const startX = canvasPadding + ((from + 0.3) * barWidth);
        const endX = canvasPadding + ((to - 0.3) * barWidth);
        const Y = startY + (partHeight / 2);
        ctx.moveTo(startX, Y);
        ctx.lineTo(endX, Y);

        var lightness, saturation, transparency;

        // If current bar is highlighted
        if (currentpos >= from && currentpos < to) {
          saturation = 80;
          lightness = (67 - (3 * p)) * pulses[c][p];
          transparency = 1; // pulses[c][p];
        }
        // if current choir/part is highlighted
        else if (c == (currentChoir - 1) && (currentPart == 0 || p == (currentPart - 1))) {
          saturation = 80;
          lightness = 67 - (3 * p);
          transparency = 1;
        }
        // else if (c == (currentChoir - 1) && p == (currentPart - 1)) {
        //   lightness = 67 - (3 * p);
        //   saturation = 80;
        //   transparency = 1;
        // }
        else if (currentChoir === 0 && currentPart === 0 && b === 0) {
          saturation = 50;
          lightness = 67 - (3 * p);
          transparency = 1;
        }
        else {
          saturation = 50;
          lightness = 67 - (3 * p);
          transparency = 0.5;
        }

        ctx.strokeStyle = `hsla(${choirColors[c]}, ${saturation}%, ${lightness}%, ${transparency})`;
        ctx.stroke();

      });
    }
  }

}

function getMousePos(canv, evt) {
  const rect = canv.getBoundingClientRect();
  const y = (evt.offsetY * 8) / rect.height;
  return [
    Math.floor(y + 1),
    Math.floor(((y % 1) * 5) + 1),
    // Math.floor(((evt.offsetX * 138) / rect.width) + 1),
    Math.floor((evt.offsetX * 140) / rect.width),
  ];
}

function getFilename(s) {
  return s.split("/").pop();
}

function loadAudio(c, p, b) {
  let newfile = defaultaudiofile;
  if (c != '0' && p != '0') {
    newfile = `/audio/spem-${c}-${getPartName(p)}.mp3`;
  }

  // just compare the filename, not the whole URL, to see if we
  // need to load a new MP3
  if (getFilename(newfile) != getFilename(spemaudio.currentSrc)) {
    spemaudio.src = newfile;
    spemaudio.load();
  }

  spemaudio.currentTime = b * 4 * beattime;
}

async function playSpem() {
  if (spemaudio.paused) {

    // set the play button spinner while loading audio
    playpauseicon.style.display = "none";
    spinner.style.display = "block";

    await spemaudio.play();

    // set the play button to pause again
    playpauseicon.style.display = "block";
    spinner.style.display = "none";
    playpauseicon.classList.remove("paused");

    // Animate while playing
    window.requestAnimationFrame(playLoop);
  }
}

let oldTimeStamp;
let fps;  // frames per second

function playLoop(timestamp) {

  // Calculate the frames per second
  const secondsPassed = (timestamp - oldTimeStamp) / 1000;
  oldTimeStamp = timestamp;
  fps = Math.round(1 / secondsPassed);

  // Calculate which bar we are on 
  const pos = spemaudio.currentTime / (beattime * 4);

  update(pos);
  draw(pos);

  if (pos >= 140) {
    setBar(0);
    spemaudio.currentTime = 0;
    pauseSpem();
  }
  else if (!spemaudio.paused) {
    window.requestAnimationFrame(playLoop);
  }
}


function pauseSpem() {
  if (!spemaudio.paused) {
    spemaudio.pause();
    playpauseicon.classList.add("paused");
  }
}

function playpause() {
  if (spemaudio.paused) {
    playSpem();
  }
  else {
    pauseSpem();
  }
}

// -----------------------------------------------------
// Mouse events
// -----------------------------------------------------

function canvasClicked(e) {
  const [c, p, b] = getMousePos(canvas, e);

  setChoir(c);
  setPart(p);
  setBar(b);

  pauseAndRepaint();
  playSpem();
}


let intId = 0;
function canvasMoved(e) {
  const [c, p, b] = getMousePos(canvas, e);

  choiroutput.textContent = "Choir " + c;
  partoutput.textContent = getPartName(p);
  baroutput.textContent = "Bar " + b;
  statusarea.classList.remove("hide");
  clearInterval(intId);
  intId = setInterval(function () {
    statusarea.classList.add("hide");
  }, 1500);

}

// -----------------------------------------------------
// Field events (chaning choir, part or bar)
// -----------------------------------------------------

function pauseAndRepaintNoLoad() {
  pauseAndRepaint(false);
}

function pauseAndRepaint(load = true) {
  pauseSpem();
  if (load) {
    loadAudio(currentChoir, currentPart, currentBar);
  }
  draw();
}

// -----------------------------------------------------
// Keyboard events (wasd)
// -----------------------------------------------------

function keyboardTapped(e) {
  // don't handle keyboard events on the four control widgets
  // cos it messes with the UI interaction
  const classes = [...e.target.classList];
  if (classes.includes('control')) {
    return;
  }
  if (e.isComposing || e.keyCode === 229) {
    return;
  }
  if (e.code == 'Enter') {
    playpause();
    return;
  }
  switch (e.code) {
    case 'Digit1':
    case 'Digit2':
    case 'Digit3':
    case 'Digit4':
    case 'Digit5':
    case 'Digit6':
    case 'Digit7':
    case 'Digit8':
      setChoir(e.key);
      pauseAndRepaint();
      break;
    case 'KeyS':
    case 'KeyA':
    case 'KeyT':
    case 'KeyR':
    case 'KeyB':
      setPart("satrb".indexOf(e.key) + 1);
      pauseAndRepaint();
      break;

    case 'ArrowRight':
      setBar(currentBar + 1);
      pauseAndRepaint();
      break;
    case 'ArrowLeft':
      setBar(currentBar - 1);
      pauseAndRepaint();
      break;
    case 'ArrowDown':
      setChoir(currentChoir == 8 ? 1 : currentChoir + 1);
      pauseAndRepaint();
      break;
    case 'ArrowUp':
      setChoir(currentChoir == 1 ? 8 : currentChoir - 1);
      pauseAndRepaint();
      break;
    case 'KeyX':
      setPart(0);
      pauseAndRepaint();
      break;
    default:
  }

}

// -----------------------------------------------------
// Touch events (mobible, iPad)
// -----------------------------------------------------

// TODO: Not convinced the Maths for getTouchPos() is right...
function getTouchPos(evt) {
  return (evt.targetTouches[0].pageX * 140 / canvas.clientWidth);
}

// BUG: on mobile, touch to move bar to half-way and play
// and it starts from bar 0.
function touchStarted(evt) {
  setBar(getTouchPos(evt));
  pauseAndRepaint(false);

  // BUG: [Violation] Added non-passive event listener to a scroll-blocking <some> event.
  // Can we use no bubble thing instead of preventDefault()?  Don't want gestures on canvas
  // to move the screen around when on mobile.
  evt.preventDefault();

  canvas.addEventListener("touchmove", (e) => {
    setBar(getTouchPos(e));
    pauseAndRepaint(false);
  });
  canvas.addEventListener("touchend", () => {
    pauseAndRepaint();
    // playSpem();
  });
}

function showHelp(show = true) {
  if (show) {
    backdrop.style.display = 'block';
    help.style.display = 'block';
  }
  else {
    backdrop.style.display = 'none';
    help.style.display = 'none';
  }
}

function toggleDark() {
  if (prefersDarkScheme.matches) {
    document.body.classList.toggle("light-theme");
  } else {
    document.body.classList.toggle("dark-theme");
  }
  loadColors();
  pauseAndRepaint();
}


// -----------------------------------------------------
// Set up Lilypond parser
// -----------------------------------------------------

var lyGrammar, semantics;

async function setupLilypondParser() {

  // Load the OHM grammar for Lilypond 
  const promise = await fetch('/src/ly-grammar.ohm');
  const grammarString = await promise.text();
  lyGrammar = ohm.grammar(grammarString);

  // Create a parse for Lilypond
  semantics = lyGrammar.createSemantics();

  // If lilypond input has no duration, use lastDuration; use lastNote if note name is missing
  var lastNote, lastDuration;

  function getDuration(duration) {
    var d = duration.parse()[0];
    if (d == undefined) {
      d = lastDuration;
    }
    else {
      lastDuration = d;
    }
    return d;
  }


  var lilypondVersion;
  semantics.addOperation('parse', {
    Version(_, _2, v, _3) {
      lilypondVersion = v.sourceString;
    },
    RelativeClause(variable, _, _2, note, _3, music, _4) {
      const v = variable.parse();
      const n = note.parse();
      if (v[0] != undefined) {
        scores[v[0]] = music.parse();
      }
      return scores[v];
    },
    Component(comp) {
      const c = comp.parse();
      return c;
    },
    command(_, c, _2) {
      const command = c.sourceString;
    },
    barline(_) {
      return new BarLine();
    },
    repeatedNote(duration, slur) {
      const d = duration.parse();
      const s = slur.sourceString.length == 0 ? undefined : slur.sourceString

      const note = new Note(lastNote.notename, lastNote.accidental, '', d, s);
      return note;
    },
    note(notename, accidental, octave, duration, slur) {
      const n = notename.sourceString;
      const a = accidental.sourceString.length == 0 ? undefined : accidental.sourceString;
      const o = octave.sourceString.length == 0 ? undefined : octave.sourceString;
      var d = getDuration(duration);
      const s = slur.sourceString.length == 0 ? undefined : slur.sourceString

      lastNote = new Note(n, a, o, d, s);
      return lastNote;
    },
    rest(restname, duration) {
      const r = restname.sourceString;
      var d = getDuration(duration);
      const rest = new Rest(r, d);
      return rest;
    },
    duration(duration, dotted) {
      const d = duration.sourceString;
      const dot = dotted.sourceString;
      const ret = new Duration(d, dot, 1);
      return ret;
    },
    durationScaled(duration, _, multiplier) {
      const x = duration.parse();
      const m = multiplier.parse()[0];

      return new Duration(x.duration, x.dotted, m);
    },
    fraction(a, _, b) {
      // HACK: we're ignoring the denominator altogether.  Let's hope it's not there
      return parseInt(a.sourceString);
    },
    variable(v) {
      return v.sourceString;
    },
    _iter(...children) {
      return children.map(c => c.parse());
    }
  });

}

var ranges = [];

async function processLilypond() {

  // Load the Spem lilypond file
  const promise = await fetch(lilypondfile);
  const spemly = await promise.text();

  // const spemly  = "choirVBaritone = \\relative { f2 f f}";
  // Parse it
  const result = lyGrammar.match(spemly);
  if (!result.succeeded()) {
    console.error('Bad Lilypond ' + result.message);
  }

  semantics(result).parse();

  const choirs = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];
  const parts = ["Soprano", "Alto", "Tenor", "Baritone", "Bass"];

  // Read lilypond input into dict{ position -> [ {choir, part, note}], ... }
  // Read lilypond into ranges[choir][part] = [ {from, to}, ... ]
  for (var choir = 0; choir < 8; choir++) {
    ranges[choir] = [];
    for (var part = 0; part < 5; part++) {
      ranges[choir][part] = [];
      var key = "notes" + choirs[choir] + parts[part];
      var lilypond = scores[key];

      // console.log(lilypond.map(x => (typeof x == "undefined") ? "?" : x.toString()).join(" "));

      // Pretty print where we don't show repeated durations
      // TODO: Move this functionality inside classes/Component
      // var str = [];
      // var lastlen;
      // for (var c of lilypond) {
      //   // console.log(lastlen, c.duration.sfths);
      //   str.push(c.toString(lastlen !== c.duration.sfths));
      //   lastlen = c.duration.sfths;
      // }
      // console.log(str.join(" "));

      var from = undefined;

      var pos = 1; // in hemidemisemiquavers (64ths)
      const barsize = 128; // hemidemisemiquavers in a bar
      for (var comp of lilypond) {
        if (comp instanceof Note) {
          if (from == undefined) {
            from = pos;
          }

          if (dict[pos] == undefined) {
            dict[pos] = [];
          }
          dict[pos].push({ "c": choir, "p": part, "n": comp });

          pos += comp.duration.sfths / barsize;
        }
        else if (comp instanceof Rest) {
          if (from != undefined) {
            ranges[choir][part].push({ "from": from, "to": pos });
            from = undefined;
          }

          pos += comp.duration.sfths / barsize;
        }
      }

      if (from != undefined) {
        ranges[choir][part].push({ "from": from, "to": pos });
        from = undefined;
      }

    }
  }
}


// -----------------------------------------------------
// Setup page
// -----------------------------------------------------

window.addEventListener("load", async () => {

  loadColors();
  calculateCanvasSize();
  showLoadingOnCanvas();

  await setupLilypondParser();
  await processLilypond();

  // read choir, part and bar from the URL
  parseURL();
  pauseAndRepaint();

  playpausebutton.addEventListener('click', playpause);

  svgobject.addEventListener("click", scoreClicked);
  canvas.addEventListener('click', canvasClicked);
  canvas.addEventListener('mousemove', canvasMoved, false);
  [choirselect,
    partselect,
    barinput].forEach(el => el.addEventListener('change', pauseAndRepaintNoLoad));
  document.addEventListener("keydown", keyboardTapped);
  canvas.addEventListener("touchstart", touchStarted, { passive: false });
  info.addEventListener("click", () => showHelp(true));
  backdrop.addEventListener("click", () => showHelp(false));
  darkswitch.addEventListener("click", () => toggleDark());

  // watch for change in user's preference of color scheme
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    darkswitch.checked = !darkswitch.checked;
    loadColors();
    pauseAndRepaint();
  });

  // Next line not really necessary, but will make it look clearer on browser resize
  // window.addEventListener("resize", () => {calculateCanvasSize(); draw(); });
});
