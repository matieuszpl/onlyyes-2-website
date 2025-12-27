import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import Card from "./Card";

const DigitSlot = ({ digit, positionKey }) => {
  const prevDigitRef = useRef(digit);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (digit !== prevDigitRef.current) {
      setKey(prev => prev + 1);
      prevDigitRef.current = digit;
    }
  }, [digit]);

  return (
    <motion.span
      key={`${positionKey}-${key}`}
      className="inline-block"
      style={{ transformOrigin: "center" }}
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {digit}
    </motion.span>
  );
};

export default function TimeDisplay() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return { hours, minutes, seconds };
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("pl-PL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };

  const { hours, minutes, seconds } = formatTime(time);
  const date = formatDate(time);

  return (
    <Card className="relative">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-1">
          <div className="font-mono text-3xl font-bold text-primary">
            {hours.split("").map((digit, idx) => (
              <DigitSlot key={`h-${idx}`} digit={digit} positionKey={`h-${idx}`} />
            ))}
            :
            {minutes.split("").map((digit, idx) => (
              <DigitSlot key={`m-${idx}`} digit={digit} positionKey={`m-${idx}`} />
            ))}
            :
            {seconds.split("").map((digit, idx) => (
              <DigitSlot key={`s-${idx}`} digit={digit} positionKey={`s-${idx}`} />
            ))}
          </div>
        </div>
        <div className="font-mono text-sm text-text-secondary text-right">
          {date}
        </div>
      </div>
    </Card>
  );
}

