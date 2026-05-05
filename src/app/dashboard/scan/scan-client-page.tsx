"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

type ScanResult = {
  success: boolean;
  action: "CHECK_IN" | "CHECK_OUT";
  firstName: string;
  lastName: string;
  message: string;
};

type ScanError = { error: string };
type FlashType = "success" | "error" | null;
type EventOption = {
  id: string | number;
  title: string;
  eventDate: string;
};

type RecentAttendanceItem = {
  id: string;
  officialId: string;
  firstName: string;
  lastName: string;
  eventId: string | null;
  timeIn: string;
  timeOut: string | null;
  createdAt: string;
};

const SUCCESS_BEEP_SRC =
  "data:audio/wav;base64,UklGRgQCAABXQVZFZm10IBAAAAABAAEAoA8AAEAfAAACABAAZGF0YeABAAAAAHw5OAdsx63xxzY0FeLLQOSiMNshn9OS2G4nYSwl3l7PwBseNMzqOclTDpQ4yPiExgAAfDk4B2zHrfHHNjQV4stA5KIw2yGf05LYbidhLCXeXs/AGx40zOo5yVMOlDjI+ITGAAB8OTgHbMet8cc2NBXiy0DkojDbIZ/TkthuJ2EsJd5ez8AbHjTM6jnJUw6UOMj4hMYAAHw5OAdsx63xxzY0FeLLQOSiMNshn9OS2G4nYSwl3l7PwBseNMzqOclTDpQ4yPiExgAAfDk4B2zHrfHHNjQV4stA5KIw2yGf05LYbidhLCXeXs/AGx40zOo5yVMOlDjI+ITGAAB8OTgHbMet8cc2NBXiy0DkojDbIZ/TkthuJ2EsJd5ez8AbHjTM6jnJUw6UOMj4hMYAAHw5OAdsx63xxzY0FeLLQOSiMNshn9OS2G4nYSwl3l7PwBseNMzqOclTDpQ4yPiExgAAfDk4B2zHrfHHNjQV4stA5KIw2yGf05LYbidhLCXeXs/AGx40zOo5yVMOlDjI+ITGAAB8OTgHbMet8cc2NBXiy0DkojDbIZ/TkthuJ2EsJd5ez8AbHjTM6jnJUw6UOMj4hMYAAHw5OAdsx63xxzY0FeLLQOSiMNshn9OS2G4nYSw=";

const ERROR_BEEP_SRC =
  "data:audio/wav;base64,UklGRgQCAABXQVZFZm10IBAAAAABAAEAoA8AAEAfAAACABAAZGF0YeABAAAAAN0eHjQlOWEszRGt8QPWbMdyyiXeYvzAG3kyfDmZLjQVNfWS2DbIOclJ28j4hhiiMJk5ojCGGMj4Sds5yTbIktg19TQVmS58OXkywBti/CXecspsxwPWrfHNEWEsJTkeNN0eAAAj4eLL28af0zPuUw79KZQ4jjXbIZ4DQOSHzYTGZ9HM6ssKbifKN8c2tyQ4B3rnXs9nxl7Peuc4B7ckxzbKN24nywrM6mfRhMaHzUDkngPbIY41lDj9KVMOM+6f09vG4ssj4QAA3R4eNCU5YSzNEa3xA9Zsx3LKJd5i/MAbeTJ8OZkuNBU19ZLYNsg5yUnbyPiGGKIwmTmiMIYYyPhJ2znJNsiS2DX1NBWZLnw5eTLAG2L8Jd5yymzHA9at8c0RYSwlOR403R4AACPh4svbxp/TM+5TDv0plDiONdshngNA5IfNhMZn0czqywpuJ8o3xza3JDgHeudez2fGXs965zgHtyTHNso3bifLCszqZ9GExofNQOSeA9shjjWUOP0pUw4z7p/T28biyyPhAADdHh40JTlhLM0RrfED1mzHcsol3mL8wBt5Mnw5mS40FTX1ktg2yDnJSdvI+IYYojCZOaIwhhjI+EnbOck2yJLYNfU0FZkufDl5MsAbYvw=";

const formatEventDate = (eventDate: string) => {
  const parsedDate = new Date(eventDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return eventDate;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
};

const formatDateTime = (dateValue: string | null) => {
  if (!dateValue) return "--";

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsedDate);
};

export default function ScanPage() {
  const [scannerReady, setScannerReady] = useState(false);
  const [lastScan, setLastScan] = useState<ScanResult | ScanError | null>(null);
  const [scannedCount, setScannedCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [flashType, setFlashType] = useState<FlashType>(null);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<EventOption["id"] | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendanceItem[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const successAudioRef = useRef<HTMLAudioElement | null>(null);
  const errorAudioRef = useRef<HTMLAudioElement | null>(null);
  const selectedEventIdRef = useRef<EventOption["id"] | null>(null);
  const fetchRecentAttendanceRef = useRef<() => Promise<void>>(async () => {});

  const playTone = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      // ignore blocked autoplay and device-specific playback errors
    });
  };

  const handleExportCsv = () => {
    const query =
      selectedEventId === null
        ? ""
        : `?eventId=${encodeURIComponent(String(selectedEventId))}`;
    window.location.href = `/api/attendance/export${query}`;
  };

  useEffect(() => {
    const successAudio = new Audio(SUCCESS_BEEP_SRC);
    const errorAudio = new Audio(ERROR_BEEP_SRC);
    successAudio.preload = "auto";
    errorAudio.preload = "auto";
    successAudio.volume = 0.35;
    errorAudio.volume = 0.35;
    successAudioRef.current = successAudio;
    errorAudioRef.current = errorAudio;

    return () => {
      successAudio.pause();
      errorAudio.pause();
      successAudioRef.current = null;
      errorAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!flashType) return;

    const timer = window.setTimeout(() => {
      setFlashType(null);
    }, 500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [flashType]);

  useEffect(() => {
    selectedEventIdRef.current = selectedEventId;
  }, [selectedEventId]);

  const fetchRecentAttendance = useCallback(async () => {
    const eventId = selectedEventIdRef.current;
    const query = eventId === null ? "" : `?eventId=${encodeURIComponent(String(eventId))}`;

    try {
      const res = await fetch(`/api/attendance/recent${query}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data)) {
        throw new Error("Failed to fetch recent attendance");
      }

      const validRows = data.filter((row): row is RecentAttendanceItem => {
        if (!row || typeof row !== "object") return false;
        const candidate = row as Partial<RecentAttendanceItem>;
        return (
          typeof candidate.id === "string" &&
          typeof candidate.officialId === "string" &&
          typeof candidate.firstName === "string" &&
          typeof candidate.lastName === "string" &&
          (candidate.eventId === null || typeof candidate.eventId === "string") &&
          typeof candidate.timeIn === "string" &&
          (candidate.timeOut === null || typeof candidate.timeOut === "string") &&
          typeof candidate.createdAt === "string"
        );
      });

      setRecentAttendance(validRows);
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to fetch recent attendance", err);
      }
      setRecentAttendance([]);
    }
  }, []);

  useEffect(() => {
    fetchRecentAttendanceRef.current = fetchRecentAttendance;
  }, [fetchRecentAttendance]);

  useEffect(() => {
    void fetchRecentAttendance();
  }, [selectedEventId, fetchRecentAttendance]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void fetchRecentAttendance();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchRecentAttendance]);

  useEffect(() => {
    let isMounted = true;

    const loadEvents = async () => {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        if (!res.ok || !Array.isArray(data)) {
          throw new Error("Failed to load events");
        }

        const validEvents = data.filter((event): event is EventOption => {
          if (!event || typeof event !== "object") return false;
          const candidate = event as Partial<EventOption>;
          return (
            (typeof candidate.id === "string" || typeof candidate.id === "number") &&
            typeof candidate.title === "string" &&
            typeof candidate.eventDate === "string"
          );
        });

        if (isMounted) {
          setEvents(validEvents);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to fetch events", err);
        }
        if (isMounted) {
          setEvents([]);
        }
      } finally {
        if (isMounted) {
          setEventsLoading(false);
        }
      }
    };

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const onScanSuccess = async (decodedText: string) => {
      // Extract official ID from URL like /id/{officialId}
      const idMatch = decodedText.match(/\/id\/([^\/?#]+)/i);
      if (!idMatch || !idMatch[1]) {
        setLastScan({ error: "Invalid QR code. Please scan an SK Official ID card." });
        setFlashType("error");
        playTone(errorAudioRef.current);
        return;
      }
      const officialId = idMatch[1];
      if (processingRef.current) return;
      processingRef.current = true;
      setIsProcessing(true);

      try {
        const res = await fetch("/api/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            officialId,
            eventId: selectedEventIdRef.current,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          setLastScan(data as ScanError);
          setFlashType("error");
          playTone(errorAudioRef.current);
        } else {
          setLastScan(data as ScanResult);
          setScannedCount((s) => s + 1);
          setFlashType("success");
          playTone(successAudioRef.current);
          void fetchRecentAttendanceRef.current();
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("scan POST error", err);
        }
        setLastScan({ error: "Failed to process scan. Please try again." });
        setFlashType("error");
        playTone(errorAudioRef.current);
      }

      // cooldown for 2 seconds
      setTimeout(() => {
        processingRef.current = false;
        setIsProcessing(false);
      }, 2000);
    };

    const onScanError = () => {
      // ignore intermediate scan errors
    };

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length) {
          const cameraId = cameras[0].id;
          const scanner = new Html5Qrcode("qr-reader");
          scannerRef.current = scanner;

          await scanner.start(
            cameraId,
            { fps: 10, qrbox: { width: 300, height: 300 }, aspectRatio: 1 },
            onScanSuccess,
            onScanError
          );

          setScannerReady(true);
        } else {
          setLastScan({ error: "No camera devices found." });
        }
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to start scanner", err);
        }
        setLastScan({ error: "Failed to initialize camera. Check permissions." });
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          });
      }
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-glass-border bg-surface p-6 shadow-[0_24px_48px_-24px_var(--shadow-color)] backdrop-blur-md">
      <div
        className={`pointer-events-none absolute inset-0 z-20 transition-opacity duration-500 ${
          flashType === "success"
            ? "bg-emerald-400/20 opacity-100"
            : flashType === "error"
              ? "bg-red-500/20 opacity-100"
              : "opacity-0"
        }`}
      />
      <div className="mx-auto w-full max-w-3xl text-foreground">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold">Attendance Scanner</h1>
          <p className="text-muted mt-1">Scan SK Official ID cards to check in/out</p>
        </div>

        <div className="bg-surface-elevated rounded-xl shadow-xl p-6">
          <div className="mx-auto max-w-md">
            <div className="mb-4 text-left">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="event-selector" className="block text-sm font-medium text-foreground">
                  Select Event
                </label>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  Export CSV
                </button>
              </div>
              <select
                id="event-selector"
                className="w-full rounded-md border border-glass-border bg-surface-elevated px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
                value={selectedEventId === null ? "" : String(selectedEventId)}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setSelectedEventId(null);
                    return;
                  }

                  const matchingEvent = events.find((event) => String(event.id) === value);
                  setSelectedEventId(matchingEvent ? matchingEvent.id : value);
                }}
                disabled={eventsLoading}
              >
                <option value="">General Attendance</option>
                {events.map((event) => (
                  <option key={event.id} value={String(event.id)}>
                    {event.title} ({formatEventDate(event.eventDate)})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-black rounded-lg p-3 border-2 border-glass-border">
              <div id="qr-reader" className="w-full h-80 rounded-md overflow-hidden" />
            </div>

            <div className="mt-4 text-center">
              <div className="mb-2">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${scannerReady ? 'bg-green-600 text-foreground' : 'bg-surface-elevated text-foreground'}`}>
                  {scannerReady ? (isProcessing ? 'Processing...' : 'Scanner Ready') : 'Initializing...'}
                </span>
              </div>

              {/* Status message */}
              <div className="mt-3">
                {lastScan ? (
                  'error' in lastScan ? (
                    <div className="bg-red-700/20 border border-red-700/40 text-red-100 rounded-md p-3">
                      <p className="font-semibold">Error</p>
                      <p className="text-sm mt-1">{lastScan.error}</p>
                    </div>
                  ) : (
                    <div className="bg-emerald-700/20 border border-emerald-700/40 text-emerald-100 rounded-md p-3">
                      <p className="font-semibold text-lg">{lastScan.firstName} {lastScan.lastName}</p>
                      <p className="text-sm mt-1">{lastScan.action === 'CHECK_IN' ? 'Checked In' : 'Checked Out'}</p>
                      <p className="text-xs text-foreground mt-2">{(lastScan as ScanResult).message}</p>
                    </div>
                  )
                ) : (
                  <p className="text-muted">Awaiting scan...</p>
                )}
              </div>

              <div className="mt-4 text-sm text-muted">Scans: {scannedCount}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-surface-elevated rounded-xl shadow-xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Live Attendance Feed</h2>
            <p className="text-xs text-muted">Last 10 records</p>
          </div>

          <div className="max-h-80 overflow-auto rounded-lg border border-glass-border">
            <table className="min-w-full text-sm text-foreground">
              <thead className="sticky top-0 bg-surface-elevated backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Event</th>
                  <th className="px-4 py-3 font-medium">Time In</th>
                  <th className="px-4 py-3 font-medium">Time Out</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border">
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted">
                      No recent attendance records.
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((record) => (
                    <tr key={record.id} className="hover:bg-surface-elevated/60">
                      <td className="px-4 py-3 text-foreground">
                        {record.firstName} {record.lastName}
                      </td>
                      <td className="px-4 py-3 text-muted">{record.eventId ?? "General Attendance"}</td>
                      <td className="px-4 py-3 text-muted">{formatDateTime(record.timeIn)}</td>
                      <td className="px-4 py-3 text-muted">{formatDateTime(record.timeOut)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                            record.timeOut === null
                              ? "bg-emerald-700/30 text-emerald-200"
                              : "bg-surface-elevated/70 text-foreground"
                          }`}
                        >
                          {record.timeOut === null ? "Checked In" : "Checked Out"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-muted text-sm text-center">
          <p>Allow camera access and hold the ID card steady within the box.</p>
        </div>
      </div>
    </div>
  );
}
