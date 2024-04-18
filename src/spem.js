/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */

// Make an dictionary of music positions (hemidemisemiquavers/128) to array of notes {choir, part, note}
const dict = {};

// a dictionary to hold the muic in the lilypond input file
var scores = {};



// TODO: Perhaps locations = { json: <String>, defaultaudio: <String>, audio: <String>[8][5] }?
const defaultaudiofile = '/audio/spem.mp3';
const lilypondfile = '/lilypond/spem notes.ly';

var spemaudio = new Audio();

// const beattime = 0.967; // old
// (minim = 124) === (beattime = 0.9677)
const beattime = 0.968;

// const container = document.getElementById("spemFrame");
const canvas = document.getElementById("spemCanvas");
const svgobject = document.getElementById("svgo");
var svg; // the actual SVG
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

const allparts = ['soprano', 'alto', 'tenor', 'baritone', 'bass'];

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

// use changed to know whether we need to redraw or not
// var changed = true;

// where c = 1 to 8
function setChoir(c) {


  // const svg = document.getElementById("spemSVG");
  console.log(svgobject);
  svgobject.setAttribute("data", `/svg/spem-choir${c}.svg`);

  const subdoc = svgobject.getSVGDocument();
  svg = subdoc.getElementsByTagName("svg")[0];
  svgobject.addEventListener("click", scoreClicked);

  // HACK: need to clear this otherwise we would fail to remove bar highlight from the new choir score
  previousBarHighlight = undefined;

  console.log(svg);


  const oldChoir = choirselect.value;
  if (c != oldChoir) {
    if (isNaN(c)) {
      c = 0;
    }
    choirselect.value = c;
    // changed = true;
  }
}

function setPart(p) {
  const oldPart = partselect.value;
  if (p != oldPart) {
    if (isNaN(p)) {
      p = 0;
    }
    partselect.value = p;
    // changed = true;
  }
}

const scorebars = [
  [4.2888, 24.2222, 42.4943, 61.3522, 77.9358, 97.4029, 118.4498, 139.0895, 164.1418, 187.6957, 208.0030, 236.3701, 262.4851, 287.8321, 310.3507, 336.0566, 368.2163, 399.6335, 430.1655, 454.1720, 481.0215, 508.7682, 533.3212, 559.4427, 577.9584, 590.7065, 601.3365, 611.9665, 622.5965, 633.2265, 643.8565, 654.4865, 665.1165, 675.7465, 686.3765, 697.0065, 707.6365, 718.2665, 728.8965, 739.5265, 761.6258, 787.4885, 815.1979, 839.6519, 864.0166, 887.9889, 898.6189, 909.2489, 919.8789, 930.5089, 941.1389, 951.7689, 962.3989, 973.0289, 983.6589, 994.2889, 1004.9189, 1015.5489, 1026.1789, 1036.8089, 1047.4389, 1058.0689, 1068.6989, 1079.3289, 1089.9589, 1102.7070, 1123.0645, 1141.4794, 1162.0944, 1179.9409, 1204.0745, 1230.7430, 1262.6883, 1292.9335, 1315.2489, 1341.2575, 1362.6023, 1373.2323, 1383.8623, 1394.4923, 1405.1223, 1425.1838, 1453.8216, 1480.6944, 1497.8073, 1519.2376, 1544.2766, 1565.4676, 1580.8661, 1591.4961, 1602.1261, 1619.7355, 1639.3955, 1657.6029, 1677.7309, 1700.4948, 1711.1248, 1721.7548, 1732.3848, 1743.0148, 1761.3842, 1785.6083, 1808.7445, 1828.8743, 1849.3307, 1872.3063, 1897.8853, 1925.0102, 1945.2080, 1963.1793, 1980.1194, 1990.7494, 2001.3794, 2012.0094, 2022.6394, 2033.2694, 2043.8994, 2059.2088, 2083.7880, 2105.8940, 2131.5822, 2148.9021, 2168.3458, 2189.3472, 2204.7087, 2228.9984, 2253.7963, 2279.4818, 2304.3074, 2327.9948, 2354.3278, 2374.7985, 2398.5956, 2425.4044, 2450.3550, 2473.3166, 2502.3932, 2521.0413],
  [4.2888, 25.7639, 41.5139, 57.2639, 71.4159, 92.6111, 114.2706, 137.0584, 158.2351, 181.4943, 206.2037, 233.3954, 260.1797, 289.3407, 321.8585, 351.2778, 377.1354, 406.5415, 436.2038, 470.8441, 503.3720, 535.3381, 564.3314, 596.8825, 628.7089, 648.3104, 664.0604, 679.8104, 695.5604, 711.3104, 727.0604, 742.8104, 758.5604, 774.3104, 790.0604, 805.8104, 821.5604, 837.3104, 853.0604, 868.8104, 892.1994, 919.8309, 950.1792, 982.1743, 1014.1621, 1045.2800, 1062.7673, 1078.5173, 1094.2673, 1110.0173, 1125.7673, 1141.5173, 1157.2673, 1173.0173, 1188.7673, 1204.5173, 1220.2673, 1236.0173, 1251.7673, 1267.5173, 1283.2673, 1299.0173, 1314.7673, 1330.5173, 1346.2673, 1360.4193, 1379.4334, 1400.1400, 1420.3356, 1439.1669, 1465.9533, 1492.6193, 1525.8471, 1561.6866, 1593.1154, 1624.8235, 1644.4706, 1660.2206, 1675.9706, 1691.7206, 1707.4706, 1735.9486, 1770.1472, 1807.3113, 1832.3096, 1860.8542, 1893.5158, 1921.8928, 1937.6428, 1953.3928, 1969.1428, 1998.8952, 2018.6574, 2045.9015, 2075.7056, 2099.4090, 2115.1590, 2130.9090, 2146.6590, 2162.4090, 2184.3179, 2218.7274, 2249.6411, 2275.4360, 2299.9777, 2331.5546, 2363.6167, 2395.7326, 2423.2950, 2444.5055, 2458.6575, 2474.4075, 2490.1575, 2505.9075, 2521.6575, 2537.4075, 2554.9044, 2583.4091, 2615.3516, 2642.3908, 2671.5575, 2694.4795, 2707.9931, 2725.7624, 2752.9690, 2781.1041, 2810.9157, 2841.9352, 2870.4187, 2902.4244, 2937.1922, 2968.0204, 2995.8971, 3024.6425, 3057.0204, 3089.4458, 3118.9462, 3144.2318],
  [4.2888, 25.7639, 41.5139, 57.2639, 73.0139, 88.7639, 104.5139, 120.2639, 136.0139, 151.7639, 167.5139, 184.7855, 205.9363, 227.0306, 251.3493, 278.0238, 305.2169, 329.9481, 362.6530, 396.2798, 424.4341, 455.5144, 482.1750, 508.7815, 539.2766, 564.3658, 580.1158, 595.8658, 611.6158, 627.3658, 643.1158, 658.8658, 674.6158, 690.3658, 706.1158, 723.4871, 747.3107, 777.5322, 797.4584, 813.2084, 839.4798, 869.0889, 896.4546, 927.4961, 955.1079, 982.0119, 1001.3275, 1017.0775, 1032.8275, 1048.5775, 1064.3275, 1080.0775, 1095.8275, 1111.5775, 1127.3275, 1143.0775, 1158.8275, 1178.1931, 1202.7324, 1230.7519, 1258.1043, 1283.9713, 1312.0222, 1341.4360, 1376.0369, 1386.2783, 1402.0283, 1417.7783, 1433.5283, 1450.5028, 1481.8999, 1508.7408, 1537.7985, 1570.2057, 1596.1201, 1626.2265, 1654.8818, 1670.6318, 1686.3818, 1702.1318, 1717.8818, 1733.6318, 1749.3818, 1765.1318, 1787.0940, 1806.8867, 1841.6604, 1865.4365, 1894.9951, 1918.2018, 1947.5997, 1972.1627, 1987.9127, 2003.6627, 2019.4127, 2035.1627, 2063.6343, 2090.8625, 2122.4530, 2142.1293, 2157.8793, 2173.6293, 2189.3793, 2205.1293, 2231.5206, 2259.0932, 2287.4822, 2318.8378, 2340.2356, 2364.0052, 2381.2407, 2396.9907, 2412.7407, 2429.9765, 2457.2225, 2484.2107, 2513.4505, 2539.3450, 2556.9663, 2572.7163, 2588.4663, 2604.2163, 2624.8248, 2649.6981, 2673.8228, 2700.7133, 2730.4105, 2760.8718, 2784.4669, 2813.0731, 2846.4782, 2873.4687, 2902.9202, 2934.0755, 2962.6772, 2991.6036, 3020.7954, 3049.9343],
  [5.5588, 27.0340, 42.7840, 58.5340, 74.2840, 90.0340, 105.7840, 121.5340, 137.2840, 153.0340, 168.7840, 184.5340, 200.2840, 216.0340, 231.7840, 247.5340, 264.8614, 285.9845, 311.5908, 336.4386, 358.5828, 383.3036, 406.9055, 432.1032, 461.8977, 492.7479, 524.3305, 549.3780, 563.5300, 579.2800, 595.0300, 610.7800, 626.5300, 642.2800, 658.0300, 675.4511, 697.7995, 725.7016, 751.3673, 767.1173, 793.1708, 821.1515, 849.3414, 879.9263, 912.1310, 939.1504, 960.2304, 975.9804, 991.7304, 1007.4804, 1023.2304, 1038.9804, 1054.7304, 1070.4804, 1086.2304, 1101.9804, 1119.2334, 1140.5460, 1166.6602, 1196.2221, 1226.2360, 1255.9342, 1282.2053, 1315.4445, 1352.5142, 1379.8274, 1395.5774, 1411.3274, 1427.0774, 1444.7405, 1470.9196, 1504.2454, 1537.3991, 1570.6110, 1602.4339, 1632.9982, 1652.5619, 1668.3119, 1684.0619, 1699.8119, 1715.5619, 1731.3119, 1747.0619, 1762.8119, 1788.2965, 1805.9120, 1836.3279, 1860.6537, 1881.2940, 1901.2549, 1921.8577, 1941.7908, 1957.5408, 1973.2908, 1989.0408, 2004.7908, 2025.7882, 2051.2827, 2081.9976, 2099.6501, 2115.4001, 2131.1501, 2146.9001, 2162.6501, 2193.3229, 2222.4122, 2251.4471, 2281.4267, 2304.8692, 2332.3454, 2346.4974, 2362.2474, 2377.9974, 2393.7474, 2417.1456, 2448.0981, 2479.8771, 2504.4848, 2524.5454, 2540.2954, 2556.0454, 2571.7954, 2585.3162, 2610.9000, 2639.4728, 2666.4009, 2693.8989, 2723.5247, 2751.6571, 2781.3111, 2811.9503, 2843.3468, 2875.5499, 2903.4700, 2934.4406, 2963.8708, 2995.5604, 3015.9590],
  [4.2888, 25.7639, 41.5139, 57.2639, 73.0139, 88.7639, 104.5139, 120.2639, 136.0139, 151.7639, 167.5139, 183.2639, 199.0139, 214.7639, 230.5139, 246.2639, 262.0139, 277.7639, 293.5139, 309.2639, 325.0139, 340.7639, 356.5139, 377.6973, 398.6414, 420.9765, 446.9742, 471.4327, 500.8436, 528.2908, 556.7124, 582.3952, 607.4852, 632.3612, 658.3344, 675.4987, 691.2487, 706.9987, 722.7487, 738.4987, 764.7676, 789.9052, 820.3945, 851.3139, 880.3419, 908.5055, 928.4570, 944.2070, 959.9570, 975.7070, 996.9165, 1022.5913, 1052.7799, 1074.9307, 1101.2497, 1127.9298, 1160.7915, 1191.4153, 1218.5213, 1243.4803, 1261.0103, 1276.7603, 1292.5103, 1308.2603, 1324.0103, 1339.7603, 1355.5103, 1371.2603, 1387.0103, 1411.6860, 1439.9900, 1469.3499, 1500.8793, 1535.2871, 1566.8611, 1599.0346, 1626.7785, 1644.1029, 1670.7303, 1696.9679, 1728.2467, 1751.0026, 1766.7526, 1782.5026, 1798.2526, 1817.6290, 1845.5942, 1879.3422, 1899.5312, 1915.2812, 1931.0312, 1946.7812, 1962.5312, 1978.2812, 1994.0312, 2011.5075, 2032.6619, 2060.2891, 2086.8996, 2108.8100, 2137.3393, 2163.1695, 2178.9195, 2194.6695, 2210.4195, 2226.1695, 2241.9195, 2257.6695, 2275.0265, 2298.1227, 2323.9356, 2346.1166, 2372.8336, 2395.0133, 2412.8777, 2428.6277, 2444.3777, 2460.1277, 2475.8777, 2491.6277, 2507.3777, 2523.1277, 2549.9874, 2581.3243, 2600.9389, 2626.9945, 2656.3832, 2684.7095, 2716.7371, 2745.0198, 2773.8481, 2806.1113, 2834.0260, 2865.2933, 2895.9709, 2925.3237, 2954.0878, 2964.3292],
  [4.2888, 25.7639, 41.5139, 57.2639, 71.4159, 92.6111, 114.2706, 137.0584, 158.2351, 181.4943, 206.2037, 233.3954, 260.1797, 289.3407, 321.8585, 351.2778, 377.1354, 406.5415, 436.2038, 470.8441, 503.3720, 535.3381, 564.3314, 596.8825, 628.7089, 648.3104, 664.0604, 679.8104, 695.5604, 711.3104, 727.0604, 742.8104, 758.5604, 774.3104, 790.0604, 805.8104, 821.5604, 837.3104, 853.0604, 868.8104, 892.1994, 919.8309, 950.1792, 982.1743, 1014.1621, 1045.2800, 1062.7673, 1078.5173, 1094.2673, 1110.0173, 1125.7673, 1141.5173, 1157.2673, 1173.0173, 1188.7673, 1204.5173, 1220.2673, 1236.0173, 1251.7673, 1267.5173, 1283.2673, 1299.0173, 1314.7673, 1330.5173, 1346.2673, 1360.4193, 1379.4334, 1400.1400, 1420.3356, 1439.1669, 1465.9533, 1492.6193, 1525.8471, 1561.6866, 1593.1154, 1624.8235, 1644.4706, 1660.2206, 1675.9706, 1691.7206, 1707.4706, 1735.9486, 1770.1472, 1807.3113, 1832.3096, 1860.8542, 1893.5158, 1921.8928, 1937.6428, 1953.3928, 1969.1428, 1998.8952, 2018.6574, 2045.9015, 2075.7056, 2099.4090, 2115.1590, 2130.9090, 2146.6590, 2162.4090, 2184.3179, 2218.7274, 2249.6411, 2275.4360, 2299.9777, 2331.5546, 2363.6167, 2395.7326, 2423.2950, 2444.5055, 2458.6575, 2474.4075, 2490.1575, 2505.9075, 2521.6575, 2537.4075, 2554.9044, 2583.4091, 2615.3516, 2642.3908, 2671.5575, 2694.4795, 2707.9931, 2725.7624, 2752.9690, 2781.1041, 2810.9157, 2841.9352, 2870.4187, 2902.4244, 2937.1922, 2968.0204, 2995.8971, 3024.6425, 3057.0204, 3089.4458, 3118.9462, 3144.2318],
  [4.2888, 25.7639, 41.5139, 57.2639, 73.0139, 88.7639, 104.5139, 120.2639, 136.0139, 151.7639, 167.5139, 184.7855, 205.9363, 227.0306, 251.3493, 278.0238, 305.2169, 329.9481, 362.6530, 396.2798, 424.4341, 455.5144, 482.1750, 508.7815, 539.2766, 564.3658, 580.1158, 595.8658, 611.6158, 627.3658, 643.1158, 658.8658, 674.6158, 690.3658, 706.1158, 723.4871, 747.3107, 777.5322, 797.4584, 813.2084, 839.4798, 869.0889, 896.4546, 927.4961, 955.1079, 982.0119, 1001.3275, 1017.0775, 1032.8275, 1048.5775, 1064.3275, 1080.0775, 1095.8275, 1111.5775, 1127.3275, 1143.0775, 1158.8275, 1178.1931, 1202.7324, 1230.7519, 1258.1043, 1283.9713, 1312.0222, 1341.4360, 1376.0369, 1386.2783, 1402.0283, 1417.7783, 1433.5283, 1450.5028, 1481.8999, 1508.7408, 1537.7985, 1570.2057, 1596.1201, 1626.2265, 1654.8818, 1670.6318, 1686.3818, 1702.1318, 1717.8818, 1733.6318, 1749.3818, 1765.1318, 1787.0940, 1806.8867, 1841.6604, 1865.4365, 1894.9951, 1918.2018, 1947.5997, 1972.1627, 1987.9127, 2003.6627, 2019.4127, 2035.1627, 2063.6343, 2090.8625, 2122.4530, 2142.1293, 2157.8793, 2173.6293, 2189.3793, 2205.1293, 2231.5206, 2259.0932, 2287.4822, 2318.8378, 2340.2356, 2364.0052, 2381.2407, 2396.9907, 2412.7407, 2429.9765, 2457.2225, 2484.2107, 2513.4505, 2539.3450, 2556.9663, 2572.7163, 2588.4663, 2604.2163, 2624.8248, 2649.6981, 2673.8228, 2700.7133, 2730.4105, 2760.8718, 2784.4669, 2813.0731, 2846.4782, 2873.4687, 2902.9202, 2934.0755, 2962.6772, 2991.6036, 3020.7954, 3049.9343],
  [5.5588, 27.0340, 42.7840, 58.5340, 74.2840, 90.0340, 105.7840, 121.5340, 137.2840, 153.0340, 168.7840, 184.5340, 200.2840, 216.0340, 231.7840, 247.5340, 264.8614, 285.9845, 311.5908, 336.4386, 358.5828, 383.3036, 406.9055, 432.1032, 461.8977, 492.7479, 524.3305, 549.3780, 563.5300, 579.2800, 595.0300, 610.7800, 626.5300, 642.2800, 658.0300, 675.4511, 697.7995, 725.7016, 751.3673, 767.1173, 793.1708, 821.1515, 849.3414, 879.9263, 912.1310, 939.1504, 960.2304, 975.9804, 991.7304, 1007.4804, 1023.2304, 1038.9804, 1054.7304, 1070.4804, 1086.2304, 1101.9804, 1119.2334, 1140.5460, 1166.6602, 1196.2221, 1226.2360, 1255.9342, 1282.2053, 1315.4445, 1352.5142, 1379.8274, 1395.5774, 1411.3274, 1427.0774, 1444.7405, 1470.9196, 1504.2454, 1537.3991, 1570.6110, 1602.4339, 1632.9982, 1652.5619, 1668.3119, 1684.0619, 1699.8119, 1715.5619, 1731.3119, 1747.0619, 1762.8119, 1788.2965, 1805.9120, 1836.3279, 1860.6537, 1881.2940, 1901.2549, 1921.8577, 1941.7908, 1957.5408, 1973.2908, 1989.0408, 2004.7908, 2025.7882, 2051.2827, 2081.9976, 2099.6501, 2115.4001, 2131.1501, 2146.9001, 2162.6501, 2193.3229, 2222.4122, 2251.4471, 2281.4267, 2304.8692, 2332.3454, 2346.4974, 2362.2474, 2377.9974, 2393.7474, 2417.1456, 2448.0981, 2479.8771, 2504.4848, 2524.5454, 2540.2954, 2556.0454, 2571.7954, 2585.3162, 2610.9000, 2639.4728, 2666.4009, 2693.8989, 2723.5247, 2751.6571, 2781.3111, 2811.9503, 2843.3468, 2875.5499, 2903.4700, 2934.4406, 2963.8708, 2995.5604, 3015.9590]
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


var previousBarHighlight;

function setBar(b) {
  const oldBar = barinput.value;
  if (b != oldBar) {
    if (isNaN(b)) {
      b = 0;
    }
    if (b > 139) {
      playpauseicon.classList.add("paused");
      b = 0;
    }
    else if (b < 0) {
      b = 139;
    }
    barinput.value = b;

    // const scorebarwidth = 200;  // HACK: this should be calculated as the width of the visible score
    // const viewbox = getViewBox(b, scorebarwidth);

    const scoresvg = document.getElementById("svgo");
    const subdoc = scoresvg.getSVGDocument();
    svg = subdoc.getElementsByTagName("svg")[0];

    pt = svg.createSVGPoint();  // HACK: Created once for document

    // svg.setAttribute("viewBox", viewbox);

    const currentChoir = Number(choirselect.value) - 1;

    var newElement = document.createElementNS("http://www.w3.org/2000/svg", 'rect');
    newElement.setAttribute("x", scorebars[currentChoir][b - 1]);
    newElement.setAttribute("y", "0");
    const bw = (b >= 138 ? svg.getBBox().width - scorebars[currentChoir][137] : scorebars[currentChoir][b] - scorebars[currentChoir][b - 1]);
    newElement.setAttribute("width", bw);
    newElement.setAttribute("height", svg.getBBox().height);
    newElement.style.fill = highlightColor; //Set stroke colour
    newElement.style.fillOpacity = 0.1;
    newElement.style.strokeWidth = "5px"; //Set stroke width
    svg.appendChild(newElement);

    if (previousBarHighlight != undefined) {
      svg.removeChild(previousBarHighlight);
    }
    previousBarHighlight = newElement;

    // start scrolling after a couple of bars
    if (b > 2) {

      const pos = (scorebars[currentChoir][b - 3] / svg.getBBox().width) * svg.getBoundingClientRect().width;

      console.log("scrolling to bar " + b + " at " + pos, scorebars[currentChoir][b-3], svg.getBBox().width, svg.getBoundingClientRect().width);
      spemscore.scrollTo({
        top: 0,
        left: pos, //b * scorebarwidth,
        behavior: "smooth"
      });
    }
  }

  changed = true;
}

function parseURL() {
  const url = window.location.search.substring(1);
  const parms = url.split("&");

  for (let i = 0; i < parms.length; i++) {
    const p = parms[i].split("=");
    if (p[0] == "choir") {
      setChoir(p[1]);
    }
    else if (p[0] == "part") {
      setPart(p[1]);
    }
    else if (p[0] == "bar") {
      setBar(Number(p[1]));
    }
  }
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

  let b = Number(barinput.value);
  if (currentpos == undefined) {
    currentpos = b;
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
  // roundedRect(ctx, canvasPadding + (b * barWidth), canvasPadding, barWidth, canvas.height - canvasPadding, 10);
  if (b > 0 && b <= 139) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(canvasPadding + (b * barWidth), canvasPadding);
    ctx.lineTo(canvasPadding + (b * barWidth), canvas.height - canvasPadding);
    ctx.lineWidth = barWidth * 1.4;
    ctx.strokeStyle = highlightColor;
    ctx.lineCap = "square";
    ctx.stroke();
    ctx.restore();
  }


  // Draw highlight line for the selected choir or choir and part
  const selectedChoir = Number(choirselect.value);
  const selectedPart = Number(partselect.value);
  var startY, width;
  if (selectedPart != 0) {
    startY = canvasPadding + ((selectedChoir - 1) * choirHeight) + ((selectedPart - 1) * partHeight);
    width = partHeight * 1.4;
  }
  else {
    // center the highlight on the middle tenor line
    startY = canvasPadding + ((selectedChoir - 1) * choirHeight) + (2 * partHeight);
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
          lightness = (67 - (3 * p)) * pulses[c][p];
          saturation = 80;
          transparency = 1; // pulses[c][p];
        }
        // if current choir/part is highlighted
        else if (c == (selectedChoir - 1) && (selectedPart == 0 || p == (selectedPart - 1))) {
          lightness = 67 - (3 * p);
          saturation = 80;
          transparency = 1;
        }
        // else if (c == (selectedChoir - 1) && p == (selectedPart - 1)) {
        //   lightness = 67 - (3 * p);
        //   saturation = 80;
        //   transparency = 1;
        // }
        else if (selectedChoir === 0 && selectedPart === 0 && b === 0) {
          lightness = 67 - (3 * p);
          saturation = 50;
          transparency = 1;
        }
        else {
          lightness = 67 - (3 * p);
          saturation = 50;
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
    loadAudio(choirselect.value, partselect.value, barinput.value);
  }
  draw();
}

// -----------------------------------------------------
// Keyboard events (wasd)
// -----------------------------------------------------

let lastPart = 0;
let lastChoir = 0;
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
      setBar(Number(barinput.value) + 1);
      pauseAndRepaint();
      break;
    case 'ArrowLeft':
      setBar(Number(barinput.value) - 1);
      pauseAndRepaint();
      break;
    case 'KeyX':
      setPart(0);
      pauseAndRepaint();
      break;
    default:
  }

  // if (e.code === 'KeyD') {
  //   setBar(Number(barinput.value) + 1);
  //   pauseAndRepaint();
  // }
  // else if (e.code === 'KeyA') {
  //   setBar(Number(barinput.value) - 1);
  //   pauseAndRepaint();
  // }
  // else if (e.code === 'KeyS') {
  //   if ((choirselect.value === '8') && (partselect.value === '5')) {
  //     setChoir(0);
  //     setPart(0);
  //   }
  //   else {
  //     const p = (Number(partselect.value) % 5) + 1;  // zero-index, add 1, mod 5 and then one-index the parts
  //     setPart(p);
  //     if (p === 1) {
  //       const c = (Number(choirselect.value) % 8) + 1;  // mod 8 and one-index the choirs
  //       setChoir(c);
  //     }
  //   }
  //   pauseAndRepaint();
  // }
  // else if (e.code === 'KeyW') {
  //   if ((choirselect.value === '0') && (partselect.value === '0')) {
  //     setChoir(8);
  //     setPart(5);
  //   }
  //   else {
  //     const p = (4 + Number(partselect.value)) % 5;
  //     setPart(p);
  //     if (p === 0) {
  //       setPart(5);
  //       const c = ((7 + Number(choirselect.value)) % 8);
  //       setChoir(c);
  //     }
  //   }
  //   pauseAndRepaint();
  // }
  // Toggle between ALL choirs and selected choir
  // else if (e.code === 'KeyX') {
  //   if (choirselect.value != '0' || partselect.value != '0') {
  //     lastChoir = Number(choirselect.value);
  //     lastPart = Number(partselect.value);
  //     setChoir(0);
  //     setPart(0);
  //   }
  //   else {
  //     setChoir(lastChoir);
  //     setPart(lastPart);
  //   }
  //   pauseAndRepaint();
  // }
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
    command(_, c) {
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
      var key = "choir" + choirs[choir] + parts[part];
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
