import nodemailer from 'nodemailer';
import SettingsEmail from '../../models/Settings.email.js';

export const NewUserOrderMessage = async () => {
    const { auth, host, port, secure } = await SettingsEmail.findOne();
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
        subject: 'Your account has been successfully created – Welcome!',
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
                        #outlook a {padding: 0}
                        .ReadMsgBody {width: 100%}
                        .ExternalClass {width: 100%}
                        .ExternalClass * {line-height: 100%}
                        .logo_text {display: block;line-height: 50px;border-radius: 5px;color: #333333;border: 1px solid #333333;font-size: 35px;font-weight: bold;font-family: system-ui;letter-spacing: 2px}
                        .logo_text span {color: #fff;background-color: #333333;border-radius: 4px 0px 0px 4px;padding: 5px;margin-right: 5px}
                        body {margin: 0;padding: 0;-webkit-text-size-adjust: 100%;-ms-text-size-adjust: 100%}
                        table,td {border-collapse: collapse;mso-table-lspace: 0pt;mso-table-rspace: 0pt}
                        img {border: 0;height: auto;line-height: 100%;outline: none;text-decoration: none;-ms-interpolation-mode: bicubic}
                        p {display: block;margin: 13px 0}
                        @media only screen and (max-width: 480px) {@-ms-viewport {width: 320px} @viewport {width: 320px}}
                        @media only screen and (min-width: 480px) {.mj-column-per-100 {width: 100% !important}}
                    </style>
                    <!--[if !mso]><!-->
                    <!--<![endif]-->
                    <!--[if mso]><xml><o:OfficeDocumentSettings><o:AllowPNG /><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
                    <!--[if lte mso 11]><style type="text/css">.outlook-group-fix {width: 100% !important}</style><![endif]-->
                </head>

                <body style="background-color: #f9f9f9">
                    <div style="background-color: #f9f9f9">
                        <!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" style="width:600px;" width="600"><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                        <div style="background: #f9f9f9; background-color: #f9f9f9; margin: 0px auto; max-width: 600px">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: #f9f9f9; background-color: #f9f9f9; width: 100%">
                                <tbody>
                                    <tr>
                                        <td style="border-bottom: #333333 solid 5px; direction: ltr; font-size: 0px; padding: 20px 0; text-align: center; vertical-align: top;">
                                            <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr></tr></table><![endif]-->
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" style="width:600px;" width="600"><tr> <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]-->
                        <div style="background: #fff; background-color: #fff; margin: 0px auto; max-width: 600px">
                            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background: #fff; background-color: #fff; width: 100%">
                                <tbody>
                                    <tr>
                                        <td style="border: #dddddd solid 1px; border-top: 0px; direction: ltr; font-size: 0px; padding: 20px 0; text-align: center; vertical-align: top;">
                                            <!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td style="vertical-align:bottom;width:600px;"><![endif]-->
                                            <div class="mj-column-per-100 outlook-group-fix" style="font-size: 13px; text-align: left; direction: ltr; display: inline-block; vertical-align: bottom; width: 100%">
                                                <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align: bottom" width="100%">
                                                    <tr>
                                                        <td align="center" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse: collapse; border-spacing: 0px">
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
                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%">
                                                                <tbody>
                                                                    <tr>
                                                                        <td>
                                                                            <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%">
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td style="padding: 0px">
                                                                                            <div style="text-align: center">
                                                                                                <span style="font-size: 20px; font-family: 'Open Sans', sans-serif; color: #19191a; font-weight: 600; line-height: 30px;">
                                                                                                    Thanks for your order
                                                                                                </span>
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
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
                                                                "
                                                            >
                                                                <span style="display: block; margin-bottom: 10px; color: #555">
                                                                    Dear ${firstName} ${lastName}
                                                                </span>
                                                                <span style="display: block; color: #555; margin-bottom: 10px">
                                                                    Thanks for your order. Details for your order are below.
                                                                </span>
                                                                <span style="display: block; color: #555; margin-bottom: 10px">
                                                                    Our manager will contact you shortly to clarify the details.
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <table
                                                                cellpadding="0"
                                                                cellspacing="0"
                                                                style="
                                                                    table-layout: fixed;
                                                                    text-align: center;
                                                                    border-collapse: collapse;
                                                                    border: 1px solid #e5e5e5;
                                                                    font-size: 12px;
                                                                    line-height: 38px;
                                                                    font-family: 'Open Sans', sans-serif;
                                                                    color: #19191a;
                                                                    font-weight: normal;
                                                                    width: 100%;
                                                                "
                                                            >
                                                                <tbody>
                                                                    <tr style="background-color: #f7f7f7">
                                                                        <td style="width: 33%; border-right: 1px solid #e5e5e5">
                                                                            <span style="line-height: 18px">Order #</span>
                                                                        </td>
                                                                        <td style="width: 33%; border-right: 1px solid #e5e5e5">
                                                                            <span>Order Date</span>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="border-right: 1px solid #e5e5e5">
                                                                            <span href="#" style="text-decoration: underline; color: #027fc2" target="_blank">FS250618217042</span>
                                                                        </td>
                                                                        <td style="border-right: 1px solid #e5e5e5">06/18/2025</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <table
                                                                cellpadding="0"
                                                                cellspacing="0"
                                                                width="100%"
                                                                role="presentation"
                                                                style="background-color: transparent; min-width: 100%"
                                                            >
                                                                <tbody>
                                                                    <tr>
                                                                        <td style="padding: 0px">
                                                                            <div>
                                                                                <span
                                                                                    style="
                                                                                        font-size: 16px;
                                                                                        color: #19191a;
                                                                                        font-family: 'Open Sans', sans-serif;
                                                                                        font-weight: normal;
                                                                                        line-height: 22px;
                                                                                    "
                                                                                    >Your Order<span style="font-weight: 600"
                                                                                        >&nbsp;:&nbsp;#AL250618167041</span
                                                                                    ></span
                                                                                >
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <table
                                                                cellpadding="0"
                                                                cellspacing="0"
                                                                width="100%"
                                                                role="presentation"
                                                                style="background-color: transparent; min-width: 100%"
                                                            >
                                                                <tbody>
                                                                    <tr>
                                                                        <td style="padding: 0px">
                                                                            <table
                                                                                cellpadding="0"
                                                                                cellspacing="0"
                                                                                style="
                                                                                    table-layout: fixed;
                                                                                    text-align: center;
                                                                                    border-collapse: collapse;
                                                                                    border: 1px solid #e5e5e5;
                                                                                    font-size: 12px;
                                                                                    line-height: 38px;
                                                                                    font-family: 'Open Sans', sans-serif;
                                                                                    color: #19191a;
                                                                                    font-weight: normal;
                                                                                    width: 100%;
                                                                                "
                                                                            >
                                                                                <tbody>
                                                                                    <tr style="background-color: #f7f7f7">
                                                                                        <td style="width: 53%; border-right: 1px solid #e5e5e5">
                                                                                            <span style="line-height: 18px">Item</span>
                                                                                        </td>
                                                                                        <td style="width: 7%; border-right: 1px solid #e5e5e5">
                                                                                            <span>Qty</span>
                                                                                        </td>
                                                                                        <td style="width: 20%; border-right: 1px solid #e5e5e5">
                                                                                            <span>Unit Price</span>
                                                                                        </td>
                                                                                        <td style="width: 20%; border-right: 1px solid #e5e5e5">
                                                                                            <span>Ext. Price</span>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr style="border-top: 1px solid #e5e5e5">
                                                                                        <td style="border-right: 1px solid #e5e5e5; line-height: 17px">
                                                                                            <a
                                                                                                href="#"
                                                                                                style="text-decoration: underline; color: #027fc2"
                                                                                                target="_blank"
                                                                                            >
                                                                                                Juniper Networks Compatible 10GBASE-ER SFP+ 1310nm 40km DOM Duplex
                                                                                                LC/UPC SMF Optical Transceiver Module
                                                                                            </a>
                                                                                        </td>
                                                                                        <td style="border-right: 1px solid #e5e5e5">2</td>
                                                                                        <td style="border-right: 1px solid #e5e5e5">$799.00</td>
                                                                                        <td style="border-right: 1px solid #e5e5e5">$1,598.00</td>
                                                                                    </tr>
                                                                                    <tr style="border-top: 1px solid #e5e5e5">
                                                                                        <td style="border-right: 1px solid #e5e5e5; line-height: 17px">
                                                                                            <a
                                                                                                href="#"
                                                                                                style="text-decoration: underline; color: #027fc2"
                                                                                                target="_blank"
                                                                                            >
                                                                                                Juniper Networks Compatible 10GBASE-ER SFP+ 1310nm 40km DOM Duplex
                                                                                                LC/UPC SMF Optical Transceiver Module
                                                                                            </a>
                                                                                        </td>
                                                                                        <td style="border-right: 1px solid #e5e5e5">2</td>
                                                                                        <td style="border-right: 1px solid #e5e5e5">$799.00</td>
                                                                                        <td style="border-right: 1px solid #e5e5e5">$1,598.00</td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>

                                                            <table
                                                                cellpadding="0"
                                                                cellspacing="0"
                                                                width="100%"
                                                                role="presentation"
                                                                style="background-color: transparent; min-width: 100%; margin-top: 10px"
                                                            >
                                                                <tbody>
                                                                    <tr>
                                                                        <td style="padding: 0px">
                                                                            <table
                                                                                cellpadding="0"
                                                                                cellspacing="0"
                                                                                style="
                                                                                    text-align: center;
                                                                                    border-collapse: collapse;
                                                                                    font-size: 14px;
                                                                                    line-height: 30px;
                                                                                    font-family: 'Open Sans', sans-serif;
                                                                                    color: #19191a;
                                                                                    font-weight: normal;
                                                                                    width: 100%;
                                                                                "
                                                                            >
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td style="width: 20%"></td>
                                                                                        <td style="width: 20%"></td>
                                                                                        <td style="width: 40%; text-align: right">
                                                                                            <span>Subtotal:&nbsp;</span>
                                                                                        </td>
                                                                                        <td style="width: 20%; text-align: right">$7,935.00</td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td style="width: 20%"></td>
                                                                                        <td style="width: 20%"></td>
                                                                                        <td style="width: 40%; text-align: right">
                                                                                            <span>Shipping:&nbsp;</span>
                                                                                        </td>
                                                                                        <td style="width: 20%; text-align: right">$0.00</td>
                                                                                    </tr>

                                                                                    <tr>
                                                                                        <td style="width: 20%"></td>
                                                                                        <td style="width: 20%"></td>
                                                                                        <td style="width: 40%; text-align: right; font-weight: 600">
                                                                                            <span>Grand total:&nbsp;</span>
                                                                                        </td>
                                                                                        <td style="width: 20%; text-align: right; font-weight: 600">$7,935.00</td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>

                                                    <tr>
                                                        <td align="left" style="font-size: 0px; padding: 10px 25px; word-break: break-word">
                                                            <table
                                                                cellpadding="0"
                                                                cellspacing="0"
                                                                width="100%"
                                                                role="presentation"
                                                                style="background-color: transparent; min-width: 100%"
                                                            >
                                                                <tbody>
                                                                    <tr>
                                                                        <td style="padding: 0px">
                                                                            <table
                                                                                style="
                                                                                    border-collapse: collapse;
                                                                                    border: 1px solid #e5e5e5;
                                                                                    font-size: 14px;
                                                                                    font-family: 'Open Sans', sans-serif;
                                                                                    color: #19191a;
                                                                                    font-weight: normal;
                                                                                    line-height: 38px;
                                                                                    width: 100%;
                                                                                "
                                                                            >
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td
                                                                                            align="left"
                                                                                            colspan="3"
                                                                                            style="background-color: #f7f7f7; padding-left: 20px"
                                                                                        >
                                                                                            Payment Method
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr align="center">
                                                                                        <td align="left" style="padding-left: 20px" width="">Bank Transfer</td>
                                                                                        <td align="right" style="color: #89898c; padding-right: 20px">
                                                                                            All Charges will appear as alistar.ltd.
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                    <tr>
                                                                        <td style="padding-top: 20px">
                                                                            <table
                                                                                cellpadding="0"
                                                                                cellspacing="0"
                                                                                id="m_-7170130078957559039tb"
                                                                                style="
                                                                                    width: 100%;
                                                                                    border-collapse: collapse;
                                                                                    font-family: 'Open Sans', sans-serif;
                                                                                    color: #19191a;
                                                                                    font-weight: normal;
                                                                                    border: #e5e5e5 1px solid;
                                                                                    font-size: 12px;
                                                                                    line-height: 26px;
                                                                                "
                                                                            >
                                                                                <tbody>
                                                                                    <tr
                                                                                        style="
                                                                                            font-size: 14px;
                                                                                            background-color: #f7f7f7;
                                                                                            line-height: 38px;
                                                                                            margin-bottom: 80px;
                                                                                        "
                                                                                    >
                                                                                        <td
                                                                                            style="
                                                                                                width: 50%;
                                                                                                border-right: #e5e5e5 1px solid;
                                                                                                padding-left: 20px;
                                                                                            "
                                                                                        >
                                                                                            <span>Purchaser Billing Info</span>
                                                                                        </td>
                                                                                        <td style="width: 50%; padding-left: 20px">
                                                                                            <div><span>Deliver To</span><br /></div>
                                                                                            <div style="display: none">
                                                                                                <span>Pick Up Address</span>
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                    <tr>
                                                                                        <td
                                                                                            style="
                                                                                                width: 50%;
                                                                                                border-right: #e5e5e5 1px solid;
                                                                                                padding-left: 20px;
                                                                                            "
                                                                                            valign="top"
                                                                                        >
                                                                                            <div style="padding-top: 8px">
                                                                                                <span style="font-weight: 600">Billing Address:</span><br />
                                                                                            </div>
                                                                                            <div>
                                                                                                <span style="font-weight: 600">Attn:</span>&nbsp;Bob Marlei<br />
                                                                                            </div>
                                                                                            <span>pr. steberskova 13b</span><br /><span>jony pesto 57n Kyiv</span
                                                                                            ><br /><span>Chernigivs'ka 01001 Ukraine</span><br />
                                                                                            <div>
                                                                                                <span style="font-weight: 600">Phone:</span
                                                                                                >&nbsp;+380-990939944<br />
                                                                                            </div>
                                                                                        </td>
                                                                                        <td style="width: 50%; padding-left: 20px" valign="top">
                                                                                            <div style="padding-top: 8px">
                                                                                                <span style="font-weight: 600">Shipping Address:</span><br />
                                                                                            </div>
                                                                                            <span>Bob Marlei</span><br /><span>pr. steberskova 13b</span
                                                                                            ><br /><span>jony pesto 57n Kyiv</span><br /><span
                                                                                                >Chernigivs'ka 01001 Ukraine</span
                                                                                            ><br />
                                                                                            <div>
                                                                                                <span style="font-weight: 600">Phone:</span
                                                                                                >&nbsp;+380-990939944<br />
                                                                                            </div>
                                                                                            <div>
                                                                                                <span style="font-weight: 600">Shipping Method:</span
                                                                                                >&nbsp;customzones &amp; customzones<br />
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
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
