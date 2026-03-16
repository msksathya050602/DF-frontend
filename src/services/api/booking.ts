import axios from "axios";

import { API_SERVICE_URL } from "@/config";

export type BookingSlot = {
  id: string;
  time: string;
  available: boolean;
};

export type AvailableSlotsResponse = {
  date: string;
  slots: BookingSlot[];
  error?: string;
};

export const getAvailableSlots = async (
  date: string,
): Promise<AvailableSlotsResponse> => {
  return new Promise((resolve, reject) => {
    axios
      .get(
        API_SERVICE_URL +
          `/bookings/calendar/v2?on=${date}&practitioner_ids=253251,4906,9912,316902`,
        { withCredentials: true },
      )
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

export const bookSlot = async (
  slotId: string,
  date: string,
): Promise<{ success: boolean; message: string; bookingId?: string }> => {
  return new Promise((resolve, reject) => {
    axios
      .post(
        API_SERVICE_URL + `/bookings`,
        { slotId, date },
        { withCredentials: true },
      )
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
