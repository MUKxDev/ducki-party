import type { NextApiRequest, NextApiResponse } from "next";
import { verifySignature } from "@upstash/qstash/nextjs";
import { prisma } from "../../server/db";
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
      const now = moment().subtract(1, "day").toDate();
      const result = await prisma.rooms.deleteMany({
        where: {
          createdAt: {
            lte: now,
          },
        },
      });

      res.status(200).json({
        success: true,
        numberOfDeletedRooms: result.count,
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
