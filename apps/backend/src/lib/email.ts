import { CreateEmailOptions, Resend } from "resend";
import { env } from "../env";

export async function sendEmail(props: Omit<CreateEmailOptions, "from">) {
  try {
    const resend = new Resend(env.RESEND_API_KEY);

    const sendOpts = {
      ...props,
      from: "ccsync@ccsync.jdvivian.co.uk",
    } as CreateEmailOptions;

    const response = await resend.emails.send(sendOpts);

    if (response.error) {
      throw response.error;
    } else {
      return response.data.id;
    }
  } catch (e) {
    console.error(e);
    return false;
  }
}
