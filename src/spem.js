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
  svgobject.setAttribute("data", `/svg/spem-choir${c}.svg`);

  const subdoc = svgobject.getSVGDocument();
  svg = subdoc.getElementsByTagName("svg")[0];
  svgobject.addEventListener("click", scoreClicked);

  // HACK: need to clear this otherwise we would fail to remove bar highlight from the new choir score
  previousBarHighlight = undefined;


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


// TODO: Choir 6 Soprano
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
// BUG: need to scroll score in first three bars - even if it is scroll to zero
// BUG: when page is narrow, showing 2 previous bars is uncomfortable/wrong
// TODO: Change dark mode to moon/sun icons
// TODO: Add hide/show icon to remove score
// TODO: Visual effect for false relations
// TODO: change score border colour for different choirs
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
// BUG: highlight sometimes doesn't work in daylight mode
// TODO: Add lyrics to footer

const scorebars = [
  [1.4846, 21.4180, 39.6901, 58.5480, 75.1316, 94.5987, 115.6456, 136.2853, 161.3376, 184.8915, 205.1988, 233.5659, 259.6809, 285.0279, 307.5465, 333.2524, 365.4121, 396.8293, 427.3613, 451.3678, 478.2173, 505.9640, 530.5170, 556.6385, 575.1542, 587.9023, 598.5323, 609.1623, 619.7923, 630.4223, 641.0523, 651.6823, 662.3123, 672.9423, 683.5723, 694.2023, 704.8323, 715.4623, 726.0923, 736.7223, 758.8216, 784.6843, 812.3937, 836.8477, 861.2124, 885.1847, 895.8147, 906.4447, 917.0747, 927.7047, 938.3347, 948.9647, 959.5947, 970.2247, 980.8547, 991.4847, 1002.1147, 1012.7447, 1023.3747, 1034.0047, 1044.6347, 1055.2647, 1065.8947, 1076.5247, 1087.1547, 1099.9028, 1120.2603, 1138.6752, 1159.2902, 1177.1367, 1201.2703, 1227.9388, 1259.8841, 1290.1293, 1312.4447, 1338.4533, 1359.7980, 1370.4280, 1381.0580, 1391.6880, 1402.3180, 1422.3796, 1451.0174, 1477.8902, 1495.0031, 1516.4333, 1541.4724, 1562.6634, 1578.0619, 1588.6919, 1599.3219, 1616.9313, 1636.5912, 1654.7986, 1674.9267, 1697.6905, 1708.3205, 1718.9505, 1729.5805, 1740.2105, 1758.5800, 1782.8041, 1805.9403, 1826.0700, 1846.5265, 1869.5021, 1895.0811, 1922.2060, 1942.4038, 1960.3751, 1977.3152, 1987.9452, 1998.5752, 2009.2052, 2019.8352, 2030.4652, 2041.0952, 2056.4046, 2080.9837, 2103.0897, 2128.7779, 2146.0978, 2165.5416, 2186.5430, 2201.9045, 2226.1942, 2250.9921, 2276.6776, 2301.5031, 2325.1906, 2351.5236, 2371.9943, 2395.7914, 2422.6002, 2447.5507, 2470.5124, 2499.5890, 2518.2371],
  [1.4846, 21.6116, 36.0135, 50.4154, 63.6897, 83.5860, 103.9603, 125.3876, 145.3090, 167.1595, 190.7762, 216.6967, 241.9143, 269.7093, 301.2162, 329.2269, 353.5704, 381.5153, 409.6635, 443.0545, 474.0685, 504.3100, 531.6883, 563.1545, 593.7703, 612.1766, 626.5785, 640.9804, 655.3822, 669.7841, 684.1860, 698.5879, 712.9898, 727.3917, 741.7936, 756.1955, 770.5974, 784.9993, 799.4012, 813.8031, 835.7879, 861.8438, 890.4674, 920.7525, 951.0156, 980.5161, 996.9143, 1011.3161, 1025.7180, 1040.1199, 1054.5218, 1068.9237, 1083.3256, 1097.7275, 1112.1294, 1126.5313, 1140.9332, 1155.3351, 1169.7370, 1184.1389, 1198.5408, 1212.9427, 1227.3446, 1241.7465, 1256.1484, 1269.4227, 1287.2398, 1306.6473, 1325.5852, 1343.2756, 1368.4953, 1393.7292, 1425.6213, 1460.2100, 1490.5461, 1520.5295, 1538.9805, 1553.3824, 1567.7843, 1582.1862, 1596.5881, 1623.5095, 1655.9980, 1691.5428, 1715.2377, 1742.2727, 1773.2243, 1800.0873, 1814.4892, 1828.8911, 1843.2930, 1871.5850, 1890.1501, 1915.8846, 1944.0737, 1966.3695, 1980.7714, 1995.1733, 2009.5752, 2023.9770, 2044.6161, 2077.3010, 2106.4901, 2130.7720, 2154.0147, 2183.8669, 2214.2482, 2244.6540, 2270.7069, 2290.7587, 2304.0331, 2318.4350, 2332.8369, 2347.2388, 2361.6407, 2376.0425, 2392.4511, 2419.3366, 2449.5544, 2475.0270, 2502.5509, 2524.2528, 2536.9324, 2553.6309, 2579.2727, 2605.7895, 2633.9291, 2663.2240, 2690.1803, 2720.4614, 2753.5483, 2782.8625, 2809.1199, 2836.2225, 2866.8903, 2897.6583, 2925.5686, 2949.3822],
  [1.4846, 22.2724, 37.3351, 52.3978, 67.4605, 82.5232, 97.5859, 112.6486, 127.7113, 142.7740, 157.8367, 174.5534, 195.0406, 215.4710, 239.0446, 264.9427, 291.3771, 315.3901, 347.6105, 380.7071, 408.0847, 438.5571, 464.4615, 490.2882, 520.1569, 544.5015, 559.5642, 574.6269, 589.6896, 604.7523, 619.8150, 634.8777, 649.9404, 665.0031, 680.0658, 696.8823, 719.9877, 749.3597, 768.6750, 783.7377, 809.3155, 838.0870, 864.6420, 894.8288, 921.6224, 947.7640, 966.4929, 981.5556, 996.6183, 1011.6810, 1026.7437, 1041.8064, 1056.8691, 1071.9318, 1086.9945, 1102.0572, 1117.1199, 1135.8769, 1159.6676, 1186.8848, 1213.4348, 1238.5040, 1265.7294, 1294.3130, 1328.0421, 1337.9613, 1353.0240, 1368.0867, 1383.1494, 1399.5913, 1430.1361, 1456.1782, 1484.4909, 1516.1479, 1541.3978, 1570.6518, 1598.5366, 1613.5993, 1628.6620, 1643.7247, 1658.7874, 1673.8501, 1688.9128, 1703.9755, 1725.2486, 1744.4306, 1778.3473, 1801.4664, 1830.2850, 1852.7736, 1881.4315, 1905.2495, 1920.3122, 1935.3749, 1950.4376, 1965.5003, 1993.1782, 2019.6099, 2050.3555, 2069.4210, 2084.4837, 2099.5464, 2114.6091, 2129.6718, 2155.3008, 2182.0502, 2209.6232, 2240.1149, 2260.8483, 2283.9467, 2300.6255, 2315.6882, 2330.7509, 2347.4319, 2373.8801, 2400.0705, 2428.4857, 2453.6361, 2470.7026, 2485.7653, 2500.8280, 2515.8907, 2535.8570, 2559.9920, 2583.3740, 2609.4666, 2638.3114, 2667.9546, 2690.8315, 2718.6121, 2751.3013, 2777.4931, 2806.0921, 2836.4053, 2864.1850, 2892.4236, 2920.7820, 2949.0724],
  [1.4846, 22.5188, 37.8279, 53.1370, 68.4461, 83.7552, 99.0643, 114.3734, 129.6826, 144.9917, 160.3008, 175.6099, 190.9190, 206.2281, 221.5372, 236.8463, 253.8177, 274.5150, 299.6407, 324.0967, 345.7974, 370.1235, 393.2647, 417.9815, 447.2435, 477.5440, 508.5639, 533.1283, 546.9932, 562.3023, 577.6114, 592.9205, 608.2296, 623.5387, 638.8478, 655.9129, 677.8178, 705.2124, 730.3844, 745.6935, 771.2877, 798.7388, 826.4039, 856.4467, 888.1046, 914.6203, 935.3099, 950.6190, 965.9281, 981.2372, 996.5463, 1011.8554, 1027.1645, 1042.4736, 1057.7827, 1073.0918, 1089.9889, 1110.8759, 1136.4952, 1165.5275, 1194.9964, 1224.1650, 1249.9333, 1282.6085, 1319.1142, 1345.9348, 1361.2439, 1376.5530, 1391.8621, 1409.1693, 1434.8455, 1467.7201, 1500.3489, 1533.1002, 1564.4671, 1594.5019, 1613.6749, 1628.9840, 1644.2931, 1659.6022, 1674.9113, 1690.2204, 1705.5295, 1720.8386, 1745.8390, 1763.0975, 1792.9900, 1816.8450, 1837.0748, 1856.6439, 1876.8361, 1896.3774, 1911.6865, 1926.9956, 1942.3047, 1957.6138, 1978.1864, 2003.1872, 2033.3476, 2050.6428, 2065.9519, 2081.2610, 2096.5701, 2111.8792, 2142.0238, 2170.5725, 2199.1184, 2228.5354, 2251.5172, 2278.5126, 2292.3775, 2307.6866, 2322.9957, 2338.3048, 2361.2437, 2391.6670, 2422.8966, 2447.0266, 2466.6964, 2482.0055, 2497.3146, 2512.6237, 2525.8716, 2550.9626, 2579.0236, 2605.4400, 2632.4262, 2661.5802, 2689.2132, 2718.3519, 2748.5151, 2779.4164, 2811.0554, 2838.4460, 2868.8697, 2897.8220, 2928.9476, 2948.9569],
  [1.4846, 22.8708, 38.5319, 54.1930, 69.8541, 85.5152, 101.1762, 116.8373, 132.4984, 148.1595, 163.8206, 179.4816, 195.1427, 210.8038, 226.4649, 242.1260, 257.7871, 273.4481, 289.1092, 304.7703, 320.4314, 336.0925, 351.7536, 372.8513, 393.7097, 415.9554, 441.8532, 466.2174, 495.5262, 522.8701, 551.1918, 576.7777, 601.7698, 626.5493, 652.4222, 669.5146, 685.1757, 700.8368, 716.4979, 732.1590, 758.3292, 783.3699, 813.7498, 844.5590, 873.4777, 901.5345, 921.4071, 937.0682, 952.7293, 968.3903, 989.5142, 1015.0894, 1045.1672, 1067.2287, 1093.4508, 1120.0276, 1152.7756, 1183.2885, 1210.2913, 1235.1506, 1252.6088, 1268.2698, 1283.9309, 1299.5920, 1315.2531, 1330.9142, 1346.5753, 1362.2363, 1377.8974, 1402.4771, 1430.6841, 1459.9476, 1491.3860, 1525.6870, 1557.1691, 1589.2288, 1616.8739, 1634.1266, 1660.6570, 1686.7941, 1717.9621, 1740.6279, 1756.2890, 1771.9501, 1787.6112, 1806.9089, 1834.7702, 1868.4066, 1888.5169, 1904.1779, 1919.8390, 1935.5001, 1951.1612, 1966.8223, 1982.4833, 1999.8878, 2020.9564, 2048.4803, 2074.9922, 2096.8169, 2125.2533, 2150.9837, 2166.6448, 2182.3059, 2197.9669, 2213.6280, 2229.2891, 2244.9502, 2262.2354, 2285.2387, 2310.9517, 2333.0434, 2359.6593, 2381.7496, 2399.5422, 2415.2033, 2430.8644, 2446.5255, 2462.1866, 2477.8476, 2493.5087, 2509.1698, 2535.9323, 2567.1589, 2586.6945, 2612.6506, 2641.9290, 2670.1504, 2702.0792, 2730.2515, 2759.0008, 2791.1504, 2818.9583, 2850.1152, 2880.6825, 2909.9314, 2938.5922, 2948.7919],
  [1.4846, 21.6116, 36.0135, 50.4154, 63.6897, 83.5860, 103.9603, 125.3876, 145.3090, 167.1595, 190.7762, 216.6967, 241.9143, 269.7093, 301.2162, 329.2269, 353.5704, 381.5153, 409.6635, 443.0545, 474.0685, 504.3100, 531.6883, 563.1545, 593.7703, 612.1766, 626.5785, 640.9804, 655.3822, 669.7841, 684.1860, 698.5879, 712.9898, 727.3917, 741.7936, 756.1955, 770.5974, 784.9993, 799.4012, 813.8031, 835.7879, 861.8438, 890.4674, 920.7525, 951.0156, 980.5161, 996.9143, 1011.3161, 1025.7180, 1040.1199, 1054.5218, 1068.9237, 1083.3256, 1097.7275, 1112.1294, 1126.5313, 1140.9332, 1155.3351, 1169.7370, 1184.1389, 1198.5408, 1212.9427, 1227.3446, 1241.7465, 1256.1484, 1269.4227, 1287.2398, 1306.6473, 1325.5852, 1343.2756, 1368.4953, 1393.7292, 1425.6213, 1460.2100, 1490.5461, 1520.5295, 1538.9805, 1553.3824, 1567.7843, 1582.1862, 1596.5881, 1623.5095, 1655.9980, 1691.5428, 1715.2377, 1742.2727, 1773.2243, 1800.0873, 1814.4892, 1828.8911, 1843.2930, 1871.5850, 1890.1501, 1915.8846, 1944.0737, 1966.3695, 1980.7714, 1995.1733, 2009.5752, 2023.9770, 2044.6161, 2077.3010, 2106.4901, 2130.7720, 2154.0147, 2183.8669, 2214.2482, 2244.6540, 2270.7069, 2290.7587, 2304.0331, 2318.4350, 2332.8369, 2347.2388, 2361.6407, 2376.0425, 2392.4511, 2419.3366, 2449.5544, 2475.0270, 2502.5509, 2524.2528, 2536.9324, 2553.6309, 2579.2727, 2605.7895, 2633.9291, 2663.2240, 2690.1803, 2720.4614, 2753.5483, 2782.8625, 2809.1199, 2836.2225, 2866.8903, 2897.6583, 2925.5686, 2949.3822],
  [1.4846, 22.2724, 37.3351, 52.3978, 67.4605, 82.5232, 97.5859, 112.6486, 127.7113, 142.7740, 157.8367, 174.5534, 195.0406, 215.4710, 239.0446, 264.9427, 291.3771, 315.3901, 347.6105, 380.7071, 408.0847, 438.5571, 464.4615, 490.2882, 520.1569, 544.5015, 559.5642, 574.6269, 589.6896, 604.7523, 619.8150, 634.8777, 649.9404, 665.0031, 680.0658, 696.8823, 719.9877, 749.3597, 768.6750, 783.7377, 809.3155, 838.0870, 864.6420, 894.8288, 921.6224, 947.7640, 966.4929, 981.5556, 996.6183, 1011.6810, 1026.7437, 1041.8064, 1056.8691, 1071.9318, 1086.9945, 1102.0572, 1117.1199, 1135.8769, 1159.6676, 1186.8848, 1213.4348, 1238.5040, 1265.7294, 1294.3130, 1328.0421, 1337.9613, 1353.0240, 1368.0867, 1383.1494, 1399.5913, 1430.1361, 1456.1782, 1484.4909, 1516.1479, 1541.3978, 1570.6518, 1598.5366, 1613.5993, 1628.6620, 1643.7247, 1658.7874, 1673.8501, 1688.9128, 1703.9755, 1725.2486, 1744.4306, 1778.3473, 1801.4664, 1830.2850, 1852.7736, 1881.4315, 1905.2495, 1920.3122, 1935.3749, 1950.4376, 1965.5003, 1993.1782, 2019.6099, 2050.3555, 2069.4210, 2084.4837, 2099.5464, 2114.6091, 2129.6718, 2155.3008, 2182.0502, 2209.6232, 2240.1149, 2260.8483, 2283.9467, 2300.6255, 2315.6882, 2330.7509, 2347.4319, 2373.8801, 2400.0705, 2428.4857, 2453.6361, 2470.7026, 2485.7653, 2500.8280, 2515.8907, 2535.8570, 2559.9920, 2583.3740, 2609.4666, 2638.3114, 2667.9546, 2690.8315, 2718.6121, 2751.3013, 2777.4931, 2806.0921, 2836.4053, 2864.1850, 2892.4236, 2920.7820, 2949.0724],
  [1.4846, 22.5188, 37.8279, 53.1370, 68.4461, 83.7552, 99.0643, 114.3734, 129.6826, 144.9917, 160.3008, 175.6099, 190.9190, 206.2281, 221.5372, 236.8463, 253.8177, 274.5150, 299.6407, 324.0967, 345.7974, 370.1235, 393.2647, 417.9815, 447.2435, 477.5440, 508.5639, 533.1283, 546.9932, 562.3023, 577.6114, 592.9205, 608.2296, 623.5387, 638.8478, 655.9129, 677.8178, 705.2124, 730.3844, 745.6935, 771.2877, 798.7388, 826.4039, 856.4467, 888.1046, 914.6203, 935.3099, 950.6190, 965.9281, 981.2372, 996.5463, 1011.8554, 1027.1645, 1042.4736, 1057.7827, 1073.0918, 1089.9889, 1110.8759, 1136.4952, 1165.5275, 1194.9964, 1224.1650, 1249.9333, 1282.6085, 1319.1142, 1345.9348, 1361.2439, 1376.5530, 1391.8621, 1409.1693, 1434.8455, 1467.7201, 1500.3489, 1533.1002, 1564.4671, 1594.5019, 1613.6749, 1628.9840, 1644.2931, 1659.6022, 1674.9113, 1690.2204, 1705.5295, 1720.8386, 1745.8390, 1763.0975, 1792.9900, 1816.8450, 1837.0748, 1856.6439, 1876.8361, 1896.3774, 1911.6865, 1926.9956, 1942.3047, 1957.6138, 1978.1864, 2003.1872, 2033.3476, 2050.6428, 2065.9519, 2081.2610, 2096.5701, 2111.8792, 2142.0238, 2170.5725, 2199.1184, 2228.5354, 2251.5172, 2278.5126, 2292.3775, 2307.6866, 2322.9957, 2338.3048, 2361.2437, 2391.6670, 2422.8966, 2447.0266, 2466.6964, 2482.0055, 2497.3146, 2512.6237, 2525.8716, 2550.9626, 2579.0236, 2605.4400, 2632.4262, 2661.5802, 2689.2132, 2718.3519, 2748.5151, 2779.4164, 2811.0554, 2838.4460, 2868.8697, 2897.8220, 2928.9476, 2948.9569]
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
      if (svg.contains(previousBarHighlight)) {
        svg.removeChild(previousBarHighlight);
      }
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
