import React, { forwardRef } from "react";
import type { Booking } from "@/lib/booking-store";
import type { Auditorium } from "@/lib/auditoriums";
import { formatDate } from "@/lib/booking-store";

interface Props {
  booking: Booking;
  auditorium?: Auditorium;
  qrCodeUrl?: string;
}

export const ConfirmationLetter = forwardRef<HTMLDivElement, Props>(
  ({ booking, auditorium, qrCodeUrl }, ref) => {
    return (
      <div 
        id="printable-letter"
        ref={ref} 
        className="bg-white text-black p-4 sm:p-10 max-w-4xl mx-auto w-full shadow-sm border border-border print:border-none print:shadow-none print:p-2"
        style={{ fontFamily: "'Times New Roman', Times, serif" }}
      >
        <div className="p-4 sm:p-6 print:p-4 h-full w-full relative">
          {/* Header Section */}
          <div className="border-b-[1.5px] border-blue-800 pb-1 mb-3">
          <img src="/logos/header.png" alt="MVIT Header" className="w-full h-auto object-contain" />
        </div>

        {/* Date */}
        <div className="flex justify-end mb-3 font-bold text-sm pr-2">
          <span>Date: <span className="underline decoration-dotted underline-offset-4">{new Date().toLocaleDateString('en-GB')}</span></span>
        </div>

        {/* Form Fields */}
        <div className="space-y-2 text-[0.9rem] mb-4 max-w-3xl">
          <div className="flex">
            <div className="w-64 font-medium">Name of the Auditorium</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">{auditorium?.name || "—"}</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">Name of the College</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">{booking.institution || "—"}</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">Name of the faculty/Staff sending the request</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">{booking.coordinator || "—"}</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">Name of the Department</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">{booking.department || "—"}</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">Contact No.</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">{booking.coordinatorPhone || "—"}</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">Date and duration of the Programme</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">
              {formatDate(booking.date || booking.fromDate)} ({booking.startTime} to {booking.endTime})
            </div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">No. of the Chairs Required</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">{booking.participants || "—"}</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">No. of VIP chair required on stage</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">—</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">PA system</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">Yes</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">LCD Projector</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">Yes</div>
          </div>
          <div className="flex">
            <div className="w-64 font-medium">Other facilities requirement</div>
            <div className="w-4">:</div>
            <div className="flex-1 font-semibold">{booking.purpose || "—"}</div>
          </div>
        </div>

        {/* Separator */}
        <div className="border-t border-dashed border-gray-400 my-4"></div>

        {/* Instructions Section */}
        <div className="mb-4">
          <p className="font-bold text-[0.85rem] italic underline mb-2">
            The following instructions are to be very strictly followed by our group of Institutions while using the college auditorium.
          </p>
          <ol className="list-decimal pl-5 space-y-1.5 text-[0.85rem] text-gray-900 leading-snug text-justify">
            <li>
              Air condition should be switched on before half an hour before the program starts and to be switched off immediately after the program is over.
            </li>
            <li>
              Wall posters and other decoration items may be used with the permission of the faculty in-charge who is responsible for handing over the auditorium with the original condition.
            </li>
            <li>
              Usage of burners for cooking is permitted only outside the auditorium. The furniture available inside the auditorium must be properly placed in the original position as soon as the program is over.
            </li>
            <li>
              The housekeeping persons must be arranged by the program coordinators for cleaning the auditorium as soon as the program is over.
            </li>
          </ol>
        </div>

        {/* Approval Stamp (Only if confirmed) */}
        {booking.stage === "confirmed" ? (
          <div className="flex justify-end items-center mt-1 pr-12 pb-2">
            <div 
              className="relative flex items-center justify-center w-[120px] h-[120px] rounded-full border-[2.5px] border-green-800 opacity-90 rotate-[-15deg] bg-white"
            >
              {/* Inner concentric circle */}
              <div className="absolute inset-1 rounded-full border-[1.5px] border-green-800/80" />
              
              <div className="text-center flex flex-col items-center justify-center z-10 w-full">
                <span className="text-[0.55rem] font-bold text-green-800 tracking-[0.2em] uppercase mb-1.5" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  Official
                </span>
                
                <div className="border-y-[1.5px] border-green-800/80 w-[105px] py-1.5 mb-1.5">
                  <h2 
                    className="text-base font-bold text-green-800 tracking-[0.15em] uppercase leading-none" 
                    style={{ fontFamily: "'Times New Roman', Times, serif" }}
                  >
                    APPROVED
                  </h2>
                </div>
                
                <span className="text-[0.45rem] font-bold text-green-800 tracking-[0.15em] uppercase" style={{ fontFamily: "'Times New Roman', Times, serif" }}>
                  MVIT Principal
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-end items-center mt-8 pr-12 pb-2">
            <div className="text-center">
              <div className="w-48 border-b border-black mb-2 pb-8"></div>
              <span className="text-[0.85rem] font-bold">Signature of the Principal</span>
            </div>
          </div>
        )}
      </div>
      </div>
    );
  }
);
ConfirmationLetter.displayName = "ConfirmationLetter";
