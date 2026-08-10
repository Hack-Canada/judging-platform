import type { CSSProperties } from "react";

type SwimCritter = {
  kind: "drift-r" | "drift-l" | "float";
  src: string;
  top: string;
  width: string;
  dur?: string;
  delay?: string;
  rest?: string;
  bob?: string;
  bdur?: string;
  flip?: boolean;
  inner?: "bob" | "jelly" | "sway";
  swA?: string;
  swB?: string;
};

const CRITTERS: SwimCritter[] = [
  {
    kind: "float",
    src: "/ocean/swim-beaver3.png",
    top: "calc(4.75rem + 3%)",
    width: "9.5rem",
    dur: "4.2s",
    bob: "22px",
    bdur: "3.6s",
    inner: "sway",
    swA: "-14deg",
    swB: "12deg",
  },
  {
    kind: "drift-r",
    src: "/ocean/swim-shark.png",
    top: "34%",
    width: "11rem",
    dur: "34s",
    delay: "-8s",
    rest: "42vw",
    bob: "12px",
    inner: "bob",
    flip: true,
  },
  {
    kind: "drift-r",
    src: "/ocean/swim-fish.png",
    top: "52%",
    width: "4.5rem",
    dur: "26s",
    delay: "-15s",
    rest: "28vw",
    bob: "16px",
    bdur: "5.5s",
    inner: "bob",
  },
  {
    kind: "drift-l",
    src: "/ocean/swim-fish.png",
    top: "68%",
    width: "5.5rem",
    dur: "22s",
    delay: "-4s",
    rest: "58vw",
    bob: "18px",
    bdur: "5s",
    inner: "bob",
    flip: true,
  },
  {
    kind: "float",
    src: "/ocean/swim-jellyfish.png",
    top: "78%",
    width: "5rem",
    dur: "4.8s",
    inner: "jelly",
    bdur: "4.8s",
  },
  {
    kind: "drift-l",
    src: "/ocean/swim-beaver2.png",
    top: "72%",
    width: "8rem",
    dur: "28s",
    delay: "-6s",
    rest: "40vw",
    bob: "16px",
    bdur: "4.2s",
    inner: "bob",
  },
];

/** Ambient mid-fi sea creatures drifting behind page content. */
export function SwimLayer({ quiet = false }: { quiet?: boolean }) {
  // Quiet keeps the beaver mascot + one ambient critter so the page still feels alive
  const critters = quiet
    ? CRITTERS.filter((_, i) => i === 0 || i === 4)
    : CRITTERS;

  return (
    <div className={`swim-layer ${quiet ? "swim-layer--quiet" : ""}`} aria-hidden="true">
      {critters.map((c, i) => {
        const outer =
          c.kind === "drift-r"
            ? "swim swim--drift-r"
            : c.kind === "drift-l"
              ? "swim swim--drift-l"
              : "swim swim--float";

        const style: CSSProperties = {
          top: c.top,
          width: c.width,
          ["--dur" as string]: c.dur,
          ["--delay" as string]: c.delay,
          ["--rest" as string]: c.rest,
          ["--bob" as string]: c.bob,
          ["--bdur" as string]: c.bdur,
          ["--swA" as string]: c.swA,
          ["--swB" as string]: c.swB,
          ...(c.kind === "float" ? { left: i % 2 === 0 ? "8%" : "78%" } : {}),
        };

        const innerClass =
          c.inner === "jelly"
            ? "swim-jelly"
            : c.inner === "sway"
              ? "swim-sway"
              : "swim-bob";

        return (
          <div key={`${c.src}-${i}`} className={outer} style={style}>
            <div className={innerClass}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                className={`swim-img${c.flip ? " flip" : ""}`}
                src={c.src}
                alt=""
                width={200}
                height={200}
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
