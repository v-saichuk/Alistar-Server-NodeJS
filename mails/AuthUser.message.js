import nodemailer from 'nodemailer';
import SettingsEmail from '../models/Settings.email.js';
export const AuthUserMessage = async (userGeo, userAgent, userEmail, ip) => {
    const { auth, host, port, secure } = await SettingsEmail.findOne();

    const { city, timezone } = userGeo;
    const now = new Date();
    const unsubscribeUrl = `https://alistar.ltd/unsubscribe?email=${encodeURIComponent(userEmail)}`;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: auth.no_reply.user,
            pass: auth.no_reply.pass,
        },
    });

    // ====== SEND INFORMATION TO MAIL ======
    const mailOptions = {
        from: `"Alistar HK LTD" <${auth.no_reply.user}>`, // Кастомна адреса відправника
        to: userEmail,
        headers: { 'List-Unsubscribe': `<${unsubscribeUrl}>` },
        subject: `Successful sign-in for ${userEmail} from new device`,
        html: `
        <!DOCTYPE html>
            <html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
                <head>
                    <title>ALISTAR</title>
                    <!--[if !mso]>-->
                    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                    <!--<![endif]-->
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />

                    <style type="text/css">
                        #outlook a {
                            padding: 0;
                        }

                        .ReadMsgBody {
                            width: 100%;
                        }

                        .ExternalClass {
                            width: 100%;
                        }

                        .ExternalClass * {
                            line-height: 100%;
                        }
                        .logo_text {
                            display: block;
                            line-height: 45px;
                            color: #333333;
                            border: 3px solid #333333;
                            font-size: 40px;
                            font-weight: bold;
                            font-family: system-ui;
                            letter-spacing: 2px;
                        }

                        .logo_text span {
                            color: #fff;
                            background-color: #333333;
                        }

                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-text-size-adjust: 100%;
                            -ms-text-size-adjust: 100%;
                        }

                        table,
                        td {
                            border-collapse: collapse;
                            mso-table-lspace: 0pt;
                            mso-table-rspace: 0pt;
                        }

                        img {
                            border: 0;
                            height: auto;
                            line-height: 100%;
                            outline: none;
                            text-decoration: none;
                            -ms-interpolation-mode: bicubic;
                        }

                        p {
                            display: block;
                            margin: 13px 0;
                        }
                    </style>
                    <!--[if !mso]><!-->
                    <style type="text/css">
                        @media only screen and (max-width: 480px) {
                            @-ms-viewport {
                                width: 320px;
                            }

                            @viewport {
                                width: 320px;
                            }
                        }
                    </style>
                    <!--<![endif]-->
                    <!--[if mso]>
                        <xml
                            ><o:OfficeDocumentSettings><o:AllowPNG /><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml
                        >
                    <![endif]-->
                    <!--[if lte mso 11]>
                        <style type="text/css">
                            .outlook-group-fix {
                                width: 100% !important;
                            }
                        </style>
                    <![endif]-->

                    <style type="text/css">
                        @media only screen and (min-width: 480px) {
                            .mj-column-per-100 {
                                width: 100% !important;
                            }
                        }
                    </style>
                </head>

                <body style="background-color: #f9f9f9">
                    <div style="background-color: #f9f9f9">
                        <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" style="width:600px;" width="600"><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                        <div style="background: #f9f9f9; background-color: #f9f9f9; margin: 0px auto; max-width: 600px">
                            <table
                                align="center"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                role="presentation"
                                style="background: #f9f9f9; background-color: #f9f9f9; width: 100%"
                            >
                                <tbody>
                                    <tr>
                                        <td
                                            style="
                                                border-bottom: #333333 solid 5px;
                                                direction: ltr;
                                                font-size: 0px;
                                                padding: 20px 0;
                                                text-align: center;
                                                vertical-align: top;
                                            "
                                        >
                                            <!--[if mso | IE
                                                ]><table role="presentation" border="0" cellpadding="0" cellspacing="0">
                                                    <tr></tr></table
                                            ><![endif]-->
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" style="width:600px;" width="600"><tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                        <div style="background: #fff; background-color: #fff; margin: 0px auto; max-width: 600px">
                            <table
                                align="center"
                                border="0"
                                cellpadding="0"
                                cellspacing="0"
                                role="presentation"
                                style="background: #fff; background-color: #fff; width: 100%"
                            >
                                <tbody>
                                    <tr>
                                        <td
                                            style="
                                                border: #dddddd solid 1px;
                                                border-top: 0px;
                                                direction: ltr;
                                                font-size: 0px;
                                                padding: 20px 0;
                                                text-align: center;
                                                vertical-align: top;
                                            "
                                        >
                                            <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:bottom;width:600px;"><![endif]-->
                                            <div
                                                class="mj-column-per-100 outlook-group-fix"
                                                style="
                                                    font-size: 13px;
                                                    text-align: left;
                                                    direction: ltr;
                                                    display: inline-block;
                                                    vertical-align: bottom;
                                                    width: 100%;
                                                "
                                            >
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: bottom" width="100%">
                                                    <tr>
                                                        <td align="center" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <table
                                                                align="center"
                                                                border="0"
                                                                cellpadding="0"
                                                                cellspacing="0"
                                                                role="presentation"
                                                                style="border-collapse: collapse; border-spacing: 0px"
                                                            >
                                                                <tbody>
                                                                    <tr>
                                                                        <td>
                                                                            <div class="logo_text"><span>ALI</span>STAR</div>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>

                                                    <!-- <tr>
                                                    <td align="center" style="font-size:0px;padding:10px 25px;padding-bottom:40px;word-break:break-word;">
                                                        <div style="font-family:'Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:bold;line-height:1;text-align:center;color:#555;"> We're verifying a recent sign-in for ${userEmail}: </div>
                                                    </td>
                                                </tr> -->

                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <div
                                                                style="
                                                                    font-family: 'Helvetica Neue', Arial, sans-serif;
                                                                    font-size: 16px;
                                                                    line-height: 22px;
                                                                    text-align: left;
                                                                "
                                                            >
                                                                <span style="display: block; margin-bottom: 10px; color: #555"
                                                                    >We're verifying a recent sign-in for ${userEmail}!</span
                                                                >
                                                                <span style="display: block; color: #555"
                                                                    >You're receiving this message because of a successful sign-in from a device that we didn’t
                                                                    recognize.</span
                                                                >
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <div
                                                                style="
                                                                    font-family: 'Helvetica Neue', Arial, sans-serif;
                                                                    font-size: 16px;
                                                                    line-height: 22px;
                                                                    text-align: left;
                                                                    color: #555;
                                                                    background-color: #f9f9f9;
                                                                    padding: 15px;
                                                                "
                                                            >
                                                                <span style="display: block"><b>City:</b> ${city}</span>
                                                                <span style="display: block"><b>Timezone:</b> ${timezone}</span>
                                                                <span style="display: block"
                                                                    ><b>Timestamp:</b> ${now.toISOString().replace('T', ' ').split('.')[0]} GMT</span
                                                                >
                                                                <span style="display: block"><b>IP Address:</b> ${ip}</span>
                                                                <span style="display: block">${userAgent}</span>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <div
                                                                style="
                                                                    font-family: 'Helvetica Neue', Arial, sans-serif;
                                                                    font-size: 16px;
                                                                    line-height: 22px;
                                                                    text-align: left;
                                                                    color: #555;
                                                                "
                                                            >
                                                                <b>If you believe that this sign-in is suspicious, please reset your password immediately.</b>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td
                                                            align="center"
                                                            style="
                                                                font-size: 0px;
                                                                padding: 10px 25px;
                                                                padding-top: 30px;
                                                                padding-bottom: 30px;
                                                                word-break: break-word;
                                                            "
                                                        >
                                                            <table
                                                                align="center"
                                                                border="0"
                                                                cellpadding="0"
                                                                cellspacing="0"
                                                                role="presentation"
                                                                style="border-collapse: separate; line-height: 100%"
                                                            >
                                                                <tr>
                                                                    <td
                                                                        align="center"
                                                                        bgcolor="#333333"
                                                                        role="presentation"
                                                                        style="border: none; border-radius: 3px; color: #ffffff; cursor: auto; padding: 15px 25px"
                                                                        valign="middle"
                                                                    >
                                                                        <p
                                                                            style="
                                                                                background: #333333;
                                                                                color: #ffffff;
                                                                                font-family: 'Helvetica Neue', Arial, sans-serif;
                                                                                font-size: 15px;
                                                                                font-weight: normal;
                                                                                line-height: 120%;
                                                                                margin: 0;
                                                                                text-decoration: none;
                                                                                text-transform: none;
                                                                            "
                                                                        >
                                                                            <a
                                                                                href="https://alistar.ltd/my-account/profile"
                                                                                target="_blank"
                                                                                style="color: #ffffff"
                                                                            >
                                                                                Reset Your Password
                                                                            </a>
                                                                        </p>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <div
                                                                style="
                                                                    font-family: 'Helvetica Neue', Arial, sans-serif;
                                                                    font-size: 14px;
                                                                    line-height: 20px;
                                                                    text-align: left;
                                                                    color: #525252;
                                                                "
                                                            >
                                                                If you're aware of this sign-in, please disregard this notice. This can happen when you use your
                                                                browser's incognito or private browsing mode or clear your cookies.
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                            <!--[if mso | IE]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!--[if mso | IE]></td></tr></table>
                        <table align="center" border="0" cellpadding="0" cellspacing="0" style="width:600px;" width="600" > <tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                        <div style="margin: 0px auto; max-width: 600px">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width: 100%">
                                <tbody>
                                    <tr>
                                        <td style="direction: ltr; font-size: 0px; padding: 20px 0; text-align: center; vertical-align: top">
                                            <!--[if mso | IE]> <table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:bottom;width:600px;"><![endif]-->
                                            <div
                                                class="mj-column-per-100 outlook-group-fix"
                                                style="
                                                    font-size: 13px;
                                                    text-align: left;
                                                    direction: ltr;
                                                    display: inline-block;
                                                    vertical-align: bottom;
                                                    width: 100%;
                                                "
                                            >
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                                    <tbody>
                                                        <tr>
                                                            <td style="vertical-align: bottom; padding: 0">
                                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%">
                                                                    <tr>
                                                                        <td align="center" style="font-size: 0px; padding: 0; word-break: break-word">
                                                                            <div
                                                                                style="
                                                                                    font-family: 'Helvetica Neue', Arial, sans-serif;
                                                                                    font-size: 12px;
                                                                                    font-weight: 300;
                                                                                    line-height: 1;
                                                                                    text-align: center;
                                                                                    color: #575757;
                                                                                "
                                                                            >
                                                                                This message is sent automatically. No reply is needed.
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td align="center" style="font-size: 0px; padding: 10px; word-break: break-word">
                                                                            <div
                                                                                style="
                                                                                    font-family: 'Helvetica Neue', Arial, sans-serif;
                                                                                    font-size: 12px;
                                                                                    font-weight: 300;
                                                                                    line-height: 1;
                                                                                    text-align: center;
                                                                                    color: #575757;
                                                                                "
                                                                            >
                                                                                Unit 2A, 17/F, Glenealy Tower, No.1 Glenealy Central, Hong Kong S.A.R
                                                                            </div>
                                                                        </td>
                                                                    </tr>

                                                                    <tr>
                                                                        <td align="center" style="font-size: 0px; padding: 0; word-break: break-word">
                                                                            <div style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 300; line-height: 1; text-align: center; color: #575757;">
                                                                                <a href="${unsubscribeUrl}" style="color: #575757">Unsubscribe</a>
                                                                                from our emails
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                </table>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <!--[if mso | IE]></td></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!--[if mso | IE]></td></tr></table><![endif]-->
                    </div>
                </body>
            </html>
        `,
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Помилка відправки листа:', error);
                return reject(error);
            }
            console.log('Лист відправлено:', info.response);
            resolve(true); // Успішна відправка повертає `true`
        });
    });

    // ====== ./SEND INFORMATION TO MAIL ======
};
