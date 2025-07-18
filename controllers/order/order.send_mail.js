import nodemailer from 'nodemailer';
import SettingsEmail from '../../models/Settings.email.js';
import Orders from '../../models/Order.js';

export const SendMailNewOrder = async (orderID, productName) => {
    const OrderData = await Orders.findById(orderID).populate('productsData.product');
    const { auth, host, port, secure } = await SettingsEmail.findOne();
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
        to: EmailData.options.to, //EmailData.options.to
        subject: 'Нове замовлення!',
        html: `<html xmlns="http://www.w3.org/1999/xhtml">
        <head>
            <meta http-equiv="content-type" content="text/html; charset=utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0;" />
            <meta name="format-detection" content="telephone=no" />
    
            <style>
                /* Reset styles */
                body {
                    margin: 0;
                    padding: 0;
                    min-width: 100%;
                    width: 100% !important;
                    height: 100% !important;
                }
                body,
                table,
                td,
                div,
                p,
                a {
                    -webkit-font-smoothing: antialiased;
                    text-size-adjust: 100%;
                    -ms-text-size-adjust: 100%;
                    -webkit-text-size-adjust: 100%;
                    line-height: 100%;
                }
                table,
                td {
                    mso-table-lspace: 0pt;
                    mso-table-rspace: 0pt;
                    border-collapse: collapse !important;
                    border-spacing: 0;
                }
                img {
                    border: 0;
                    line-height: 100%;
                    outline: none;
                    text-decoration: none ;
                    -ms-interpolation-mode: bicubic;
                }
                #outlook a {
                    padding: 0;
                }
                .ReadMsgBody {
                    width: 100%;
                }
                .ExternalClass {
                    width: 100%;
                }
                .ExternalClass,
                .ExternalClass p,
                .ExternalClass span,
                .ExternalClass font,
                .ExternalClass td,
                .ExternalClass div {
                    line-height: 100%;
                }
    
                /* Rounded corners for advanced mail clients only */
                @media all and (min-width: 560px) {
                    .container {
                        border-radius: 8px;
                        -webkit-border-radius: 8px;
                        -moz-border-radius: 8px;
                        -khtml-border-radius: 8px;
                    }
                }
    
                /* Set color for auto links (addresses, dates, etc.) */
                a {
                    color: #ffffff !important;
                }
                a,
                a:hover {
                    color: #ffffff;
                    text-decoration: none !important;
                }
                .footer a,
                .footer a:hover {
                    color: #828999;
                }
            </style>
    
            <!-- MESSAGE SUBJECT -->
            <title>Optical Modules</title>
        </head>
    
        <!-- BODY -->
        <!-- Set message background color (twice) and text color (twice) -->
        <body
            topmargin="0"
            rightmargin="0"
            bottommargin="0"
            leftmargin="0"
            marginwidth="0"
            marginheight="0"
            width="100%"
            style="
                border-collapse: collapse;
                border-spacing: 0;
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                -webkit-font-smoothing: antialiased;
                text-size-adjust: 100%;
                -ms-text-size-adjust: 100%;
                -webkit-text-size-adjust: 100%;
                line-height: 100%;
                background-color: #2d3445;
                color: #ffffff;
            "
            bgcolor="#2D3445"
            text="#FFFFFF"
        >
            <!-- SECTION / BACKGROUND -->
            <!-- Set message background color one again -->
            <table
                width="100%"
                align="center"
                border="0"
                cellpadding="0"
                cellspacing="0"
                style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0; width: 100%"
                class="background"
            >
                <tr>
                    <td align="center" valign="top" style="border-collapse: collapse; border-spacing: 0; margin: 0; padding: 0" bgcolor="#2D3445">
                        <!-- WRAPPER -->
                        <!-- Set wrapper width (twice) -->
                        <table
                            border="0"
                            cellpadding="0"
                            cellspacing="0"
                            align="center"
                            width="500"
                            style="border-collapse: collapse; border-spacing: 0; padding: 0; width: inherit; max-width: 500px"
                            class="wrapper"
                        >
                            <tr>
                                <td
                                    align="center"
                                    valign="top"
                                    style="
                                        border-collapse: collapse;
                                        border-spacing: 0;
                                        margin: 0;
                                        padding: 0;
                                        padding-left: 6.25%;
                                        padding-right: 6.25%;
                                        width: 87.5%;
                                        padding-top: 20px;
                                        padding-bottom: 20px;
                                    "
                                >
                                    <!-- PREHEADER -->
    
                                    <!-- LOGO -->
                                    <a target="_blank" style="text-decoration: none" href="https://brandonly.net/"
                                        ><img
                                            border="0"
                                            vspace="0"
                                            hspace="0"
                                            src="https://server.brandonly.net/upload/1716801029491-212093662.png"
                                            height="30"
                                            alt="Logo"
                                            title="Logo"
                                            style="
                                                color: #ffffff;
                                                font-size: 10px;
                                                margin: 0;
                                                padding: 0;
                                                outline: none;
                                                text-decoration: none;
                                                -ms-interpolation-mode: bicubic;
                                                border: none;
                                                display: block;
                                            "
                                    /></a>
                                </td>
                            </tr>
    
                            <!-- HEADER -->
                            <!-- Set text color and font family ("sans-serif" or "Georgia, serif") -->
                            <tr>
                                <td
                                    align="center"
                                    valign="top"
                                    style="
                                        border-collapse: collapse;
                                        border-spacing: 0;
                                        margin: 0;
                                        padding: 0;
                                        padding-left: 6.25%;
                                        padding-right: 6.25%;
                                        width: 87.5%;
                                        font-size: 17px;
                                        font-weight: bold;
                                        line-height: 130%;
                                        padding-top: 5px;
                                        padding-bottom: 10px;
                                        color: #ffffff;
                                        font-family: sans-serif;
                                        text-transform: uppercase;
                                    "
                                    class="header"
                                >ЗАМОВЛЕНЯ <span style=" color:#ea703f;">№${orderID.toString().slice(-5).toUpperCase()}</span></td>
                            </tr>

                            <!-- Information Table -->
                            <tr>
                                <td
                                    align="center"
                                    valign="top"
                                    style="
                                        border-collapse: collapse;
                                        border-spacing: 0;
                                        margin: 0;
                                        padding: 0;
                                        padding-left: 6.25%;
                                        padding-right: 6.25%;
                                        width: 87.5%;
                                        font-size: 17px;
                                        font-weight: 400;
                                        line-height: 160%;
                                        color: #ffffff;
                                        font-family: sans-serif;
                                    "
                                    class="paragraph"
                                >
                                    <table
                                        align="center"
                                        valign="top"
                                        style="
                                            border-collapse: collapse;
                                            border-spacing: 0;
                                            margin: 0;
                                            padding: 0;
                                            width: 100%;
                                            font-size: 13px;
                                            font-weight: 100;
                                            line-height: 160%;
                                            color: #ffffff;
                                            font-family: sans-serif;
                                            border: 1px solid #828999;
                                        "
                                        class="information-table"
                                    >
                                        <tr>
                                            <td style="padding: 10px; border: 1px solid #828999;">Назва</td>
                                            <td style="padding: 10px; border: 1px solid #828999;">К-ть</td>
                                        </tr>
                                        ${OrderData?.productsData
                                            .map(
                                                (item) => `
                                        <tr>
                                                <td style="padding: 10px; border: 1px solid #828999;"><a href=${`https://brandonly.net/product/${item?.product._id}`} target="_blank">${
                                                    item?.product?.name['UA']
                                                }</a></td>
                                                <td style="padding: 10px; border: 1px solid #828999;">${item.qty}шт</td>
                                                </tr>
                                                `,
                                            )
                                            .join('')}
                                    </table>
                                </td>
                            </tr>
                          

                            <!-- User Information Title -->
                            <tr>
                                <td
                                    align="center"
                                    valign="top"
                                    style="
                                        border-collapse: collapse;
                                        border-spacing: 0;
                                        margin: 20px 0 10px 0;
                                        padding: 0;
                                        padding-left: 6.25%;
                                        padding-right: 6.25%;
                                        width: 87.5%;
                                        font-size: 17px;
                                        font-weight: 600;
                                        line-height: 160%;
                                        color: #fff;
                                        font-family: sans-serif;
                                        padding-top: 30px;
                                        text-transform: uppercase;
                                    "
                                    class="paragraph"
                                >ПОКУПЕЦЬ</td>
                            </tr>

                            <!-- Information Table -->
                            <tr>
                                <td
                                    align="center"
                                    valign="top"
                                    style="
                                        border-collapse: collapse;
                                        border-spacing: 0;
                                        margin: 0;
                                        padding: 0;
                                        padding-left: 6.25%;
                                        padding-right: 6.25%;
                                        width: 87.5%;
                                        font-size: 17px;
                                        font-weight: 400;
                                        line-height: 160%;
                                        color: #ffffff;
                                        font-family: sans-serif;
                                    "
                                    class="paragraph"
                                >
                                    <table
                                        align="center"
                                        valign="top"
                                        style="
                                            border-collapse: collapse;
                                            border-spacing: 0;
                                            margin: 0;
                                            padding: 0;
                                            width: 100%;
                                            font-size: 13px;
                                            font-weight: 100;
                                            line-height: 160%;
                                            color: #ffffff;
                                            font-family: sans-serif;
                                            border: 1px solid #828999;
                                        "
                                        class="information-table"
                                    >
                                        <tr>
                                            <td style="padding: 10px; border: 1px solid #828999;">Ім'я</td>
                                            <td style="padding: 10px; border: 1px solid #828999;">${OrderData?.first_name} ${
            OrderData?.last_name
        }</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px; border: 1px solid #828999;">Телефон</td>
                                            <td style="padding: 10px; border: 1px solid #828999;">${OrderData?.phone}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px; border: 1px solid #828999;">Доставка</td>
                                            <td style="padding: 10px; border: 1px solid #828999;">${OrderData?.address?.delivery?.title}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px; border: 1px solid #828999;">Оплата</td>
                                            <td style="padding: 10px; border: 1px solid #828999;">${OrderData?.payments?.title}</td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 10px; border: 1px solid #828999;">Загальна сума</td>
                                            <td style="padding: 10px; border: 1px solid #828999;">${OrderData?.totalCost}</td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- BUTTON -->
                            <tr>
                                <td
                                    align="center"
                                    valign="top"
                                    style="
                                        border-collapse: collapse;
                                        border-spacing: 0;
                                        margin: 0;
                                        padding: 0;
                                        padding-left: 6.25%;
                                        padding-right: 6.25%;
                                        width: 87.5%;
                                        padding-top: 25px;
                                        padding-bottom: 5px;
                                    "
                                    class="button"
                                >
                                    <a href=${`https://admin.brandonly.net/order/${orderID}`} target="_blank" style="text-decoration: underline">
                                        <table
                                            border="0"
                                            cellpadding="0"
                                            cellspacing="0"
                                            align="center"
                                            style="max-width: 240px; min-width: 120px; border-collapse: collapse; border-spacing: 0; padding: 0"
                                        >
                                            <tr>
                                                <td
                                                    align="center"
                                                    valign="middle"
                                                    style="
                                                        padding: 12px 24px;
                                                        margin: 0;
                                                        border-collapse: collapse;
                                                        border-spacing: 0;
                                                        border-radius: 4px;
                                                        -webkit-border-radius: 4px;
                                                        -moz-border-radius: 4px;
                                                        -khtml-border-radius: 4px;
                                                    "
                                                    bgcolor="#E9703E"
                                                >
                                                    <a
                                                        target="_blank"
                                                        style="
                                                            color: #ffffff;
                                                            font-family: sans-serif;
                                                            font-size: 17px;
                                                            font-weight: 400;
                                                            line-height: 120%;
                                                        "
                                                        href=${`https://admin.brandonly.net/order/${orderID}`}
                                                    >
                                                        Перейти до замовленя
                                                    </a>
                                                </td>
                                            </tr>
                                        </table></a
                                    >
                                </td>
                            </tr>
    
                            <!-- LINE -->
                            <!-- Set line color -->
                            <tr>
                                <td
                                    align="center"
                                    valign="top"
                                    style="
                                        border-collapse: collapse;
                                        border-spacing: 0;
                                        margin: 0;
                                        padding: 0;
                                        padding-left: 6.25%;
                                        padding-right: 6.25%;
                                        width: 87.5%;
                                        padding-top: 30px;
                                    "
                                    class="line"
                                >
                                    <hr color="#565F73" align="center" width="100%" size="1" noshade style="margin: 0; padding: 0" />
                                </td>
                            </tr>
    
                            <!-- FOOTER -->
                            <tr>
                                <td
                                    align="center"
                                    valign="top"
                                    style="
                                        border-collapse: collapse;
                                        border-spacing: 0;
                                        margin: 0;
                                        padding: 0;
                                        padding-left: 6.25%;
                                        padding-right: 6.25%;
                                        width: 87.5%;
                                        font-size: 13px;
                                        font-weight: 400;
                                        line-height: 150%;
                                        padding-top: 10px;
                                        padding-bottom: 20px;
                                        color: #828999;
                                        font-family: sans-serif;
                                    "
                                    class="footer"
                                >
                                    Це повідомлення відправляється автоматично. Відповідати на нього не потрібно.
                                </td>
                            </tr>
    
                            <!-- End of WRAPPER -->
                        </table>
    
                        <!-- End of SECTION / BACKGROUND -->
                    </td>
                </tr>
            </table>
        </body>
    </html>
    `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Помилка відправки листа: ' + error);
            res.status(500).json({ success: false, error: error.message });
        } else {
            console.log('Лист відправлено: ' + info.response);
            res.status(200).json({ success: true });
        }
    });
    // ====== ./SEND INFORMATION TO MAIL ======
};

// SendMailNewOrder('66545151339a69b18f614779', ['test product name']); //Тестове повідомленя
