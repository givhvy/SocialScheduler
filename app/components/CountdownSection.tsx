'use client';

import { useEffect, useState } from 'react';

interface CountdownBoxProps {
  title: string;
  daysCycle: number;
  storageKey: string;
}

function CountdownBox({ title, daysCycle, storageKey }: CountdownBoxProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    // Get or set start date
    let startDate = localStorage.getItem(storageKey);
    if (!startDate) {
      startDate = new Date().toISOString();
      localStorage.setItem(storageKey, startDate);
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startDate!).getTime();
      const cycleDuration = daysCycle * 24 * 60 * 60 * 1000; // Convert days to milliseconds

      const elapsed = now - start;
      const currentCycle = Math.floor(elapsed / cycleDuration);
      const nextReset = start + (currentCycle + 1) * cycleDuration;

      const difference = nextReset - now;

      if (difference <= 0) {
        // Reset the cycle
        const newStartDate = new Date().toISOString();
        localStorage.setItem(storageKey, newStartDate);
        return { days: daysCycle, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [daysCycle, storageKey]);

  return (
    <div className="glass-card flex-1">
      <h3 className="text-2xl font-bold text-black mb-6 text-center">{title}</h3>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="bg-gray-100 rounded-lg p-4 mb-2">
            <div className="text-4xl font-bold text-black">{timeLeft.days}</div>
          </div>
          <div className="text-sm text-gray-600 font-medium">Ngày</div>
        </div>
        <div className="text-center">
          <div className="bg-gray-100 rounded-lg p-4 mb-2">
            <div className="text-4xl font-bold text-black">{timeLeft.hours}</div>
          </div>
          <div className="text-sm text-gray-600 font-medium">Giờ</div>
        </div>
        <div className="text-center">
          <div className="bg-gray-100 rounded-lg p-4 mb-2">
            <div className="text-4xl font-bold text-black">{timeLeft.minutes}</div>
          </div>
          <div className="text-sm text-gray-600 font-medium">Phút</div>
        </div>
        <div className="text-center">
          <div className="bg-gray-100 rounded-lg p-4 mb-2">
            <div className="text-4xl font-bold text-black">{timeLeft.seconds}</div>
          </div>
          <div className="text-sm text-gray-600 font-medium">Giây</div>
        </div>
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        Reset mỗi {daysCycle} ngày
      </div>
    </div>
  );
}

export default function CountdownSection() {
  return (
    <div className="mt-8 mb-8">
      <h2 className="text-3xl font-bold text-black mb-6 text-center">Lịch Nhắc Nhở</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CountdownBox
          title="🫡 Countdown Ngày Cắt Tóc"
          daysCycle={14}
          storageKey="haircut-countdown-start"
        />
        <CountdownBox
          title="💆 Countdown Ngày Làm Trị Liệu"
          daysCycle={5}
          storageKey="therapy-countdown-start"
        />
      </div>
    </div>
  );
}
