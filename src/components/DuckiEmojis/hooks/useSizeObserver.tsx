/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import gsap from "gsap";

const useSizeObserver = (size: number, className: string) => {
  useEffect(() => {
    gsap.set(className, {
      fontSize: `${size}px`,
    });
  }, [size]);
};

export default useSizeObserver;
