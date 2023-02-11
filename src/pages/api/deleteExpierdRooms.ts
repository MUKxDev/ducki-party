// import { NextApiRequest, NextApiResponse } from 'next';
import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignature } from "@upstash/qstash/nextjs";
import { supabase } from "../../context/supabase";
import moment from "moment";

type Data = {
  success: boolean;
  numberOfDeletedRooms: number;
};
type DataError = {
  success: boolean;
  statusCode: number;
  message: string;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | DataError>
) {
  if (req.method === "POST") {
    try {
      const now = moment().subtract(1, "day");
      const { data, error } = await supabase
        .from("Rooms")
        .delete()
        .lte("createdAt", now.toISOString())
        .select("id");

      if (error) throw error;

      res.status(200).json({
        success: true,
        numberOfDeletedRooms: data.length,
      });
    } catch (err) {
      const e = err as Error;
      res.status(500).json({
        statusCode: 500,
        message: e.message,
        success: false,
      });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-call
export default verifySignature(handler);
// export default handler;

export const config = {
  api: {
    bodyParser: false,
  },
};
