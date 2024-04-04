import { useEffect, useRef } from "react";

const TEXT = "LOADING";

export default function Loading({ loading }: { loading: boolean }) {
  const countRef = useRef(0);
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!spanRef.current) return;

    const handler = setInterval(() => {
      if (!spanRef.current) return;
      const tail = new Array(countRef.current % 4).fill(".").join("");
      console.log(tail);
      spanRef.current.innerText = `${TEXT}${tail}`;
      countRef.current++;
    }, 500);

    return () => clearInterval(handler);
  }, []);

  if (!loading) return null;
  return (
    <span ref={spanRef} className="loading">
      {`${TEXT}...`}
    </span>
  );
}
