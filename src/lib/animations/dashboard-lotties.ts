// Handcrafted lightweight Lottie animation definitions for Ovel Dashboard
export const livePulseLottie = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 120,
  w: 60,
  h: 60,
  nm: "LivePulse",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "OuterWave",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [80] },
            { t: 90, s: [0] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [35, 35, 100] },
            { t: 90, s: [100, 100, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [46, 46] },
              p: { a: 0, k: [0, 0] },
              nm: "Ellipse"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.1, 0.75, 0.45, 0.7] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "Group"
        }
      ],
      ip: 0,
      op: 120,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "CoreBeacon",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [90, 90, 100] },
            { t: 60, s: [110, 110, 100] },
            { t: 120, s: [90, 90, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [20, 20] },
              p: { a: 0, k: [0, 0] },
              nm: "Ellipse"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.08, 0.68, 0.4, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "Group"
        }
      ],
      ip: 0,
      op: 120,
      st: 0,
      bm: 0
    }
  ]
};

export const clockLottie = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 240,
  w: 100,
  h: 100,
  nm: "ClockLottie",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "MinuteHand",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: {
          a: 1,
          k: [
            { t: 0, s: [0] },
            { t: 240, s: [360] }
          ]
        },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, -14, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "rc",
              d: 1,
              s: { a: 0, k: [2.5, 20] },
              p: { a: 0, k: [0, -10] },
              r: { a: 0, k: 1 },
              nm: "Hand"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.06, 0.37, 0.41, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "HandGroup"
        }
      ],
      ip: 0,
      op: 240,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Dial",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [97, 97, 100] },
            { t: 120, s: [102, 102, 100] },
            { t: 240, s: [97, 97, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [56, 56] },
              p: { a: 0, k: [0, 0] },
              nm: "Circle"
            },
            {
              ty: "st",
              c: { a: 0, k: [0.23, 0.57, 0.58, 0.3] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2,
              nm: "Stroke"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.96, 0.98, 0.98, 0.9] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "DialGroup"
        }
      ],
      ip: 0,
      op: 240,
      st: 0,
      bm: 0
    }
  ]
};

export const waitlistRadarLottie = {
  v: "5.5.7",
  fr: 60,
  ip: 0,
  op: 140,
  w: 60,
  h: 60,
  nm: "WaitlistRadar",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "Wave1",
      sr: 1,
      ks: {
        o: {
          a: 1,
          k: [
            { t: 0, s: [70] },
            { t: 100, s: [0] }
          ]
        },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: {
          a: 1,
          k: [
            { t: 0, s: [20, 20, 100] },
            { t: 100, s: [100, 100, 100] }
          ]
        }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [46, 46] },
              p: { a: 0, k: [0, 0] },
              nm: "Ellipse"
            },
            {
              ty: "st",
              c: { a: 0, k: [0.39, 0.76, 0.73, 0.9] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 2 },
              lc: 2,
              lj: 2,
              nm: "Stroke"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "Group"
        }
      ],
      ip: 0,
      op: 140,
      st: 0,
      bm: 0
    },
    {
      ddd: 0,
      ind: 2,
      ty: 4,
      nm: "Core",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { a: 0, k: [30, 30, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              d: 1,
              ty: "el",
              s: { a: 0, k: [12, 12] },
              p: { a: 0, k: [0, 0] },
              nm: "Ellipse"
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.39, 0.76, 0.73, 1] },
              o: { a: 0, k: 100 },
              nm: "Fill"
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              nm: "Transform"
            }
          ],
          nm: "Group"
        }
      ],
      ip: 0,
      op: 140,
      st: 0,
      bm: 0
    }
  ]
};
