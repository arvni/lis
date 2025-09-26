import {Stack, Table, TableBody, TableCell, TableFooter, TableHead, TableRow} from "@mui/material";
import Typography from "@mui/material/Typography";
import countries from "@/Data/Countries";
import Box from "@mui/material/Box";

const Print = ({invoice}) => {
    const address = [invoice.owner?.billingInfo?.address, invoice.owner?.billingInfo?.city, invoice.owner?.billingInfo?.country].filter(item => item !== undefined).join(", ");
    const invoiceDate = new Date(invoice.created_at).toDateString();
    const invoiceTime = new Date(invoice.created_at).toLocaleTimeString();
    let advPayment = {
        date: null,
        price: 0
    }
    if (invoice.patient_payments?.length > 1 || (invoice.patient_payments_sum_price < (invoice.acceptance_items_sum_price - invoice.acceptance_items_sum_discount) && invoice.patient_payments?.length)) {
        advPayment = {
            date: new Date(invoice.patient_payments[0].created_at).toLocaleDateString(),
            price: invoice.patient_payments[0].price
        }
    }
    return <>
        <Table sx={{maxWidth: "210mm", border: "none"}}>
            <TableRow>
                <TableCell sx={{padding: 0}}>
                    <Table sx={{border: "none"}}>
                        <TableRow>
                            <TableCell sx={{border: "2px solid", padding: 0, width: "80mm"}}>
                                <Table sx={{border: "none", "& td": {paddingX: "10px", paddingY: "5px"}}}>
                                    <TableRow>
                                        <TableCell colSpan={2}
                                                   sx={{border: "none", textAlign: "center", fontSize: "14px"}}>
                                            <Typography sx={{fontWeight: "bolder"}}>Muscat Medical Center
                                                LLC</Typography>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{border: "none", fontSize: "12px"}}>
                                            <>Alley 3703,No.346,South Al Ghoubrah St.
                                                Muscat, Sultanat of Oman
                                            </>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell
                                            sx={{border: "none", fontSize: "12px", width: "35mm", textAlign: "center"}}>
                                            <strong>VATIN: </strong>OM1100151715
                                        </TableCell>
                                        <TableCell sx={{border: "none", fontSize: "12px", textAlign: "center"}}>
                                            <strong>CR: </strong>1840770
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell sx={{border: "none", fontSize: "12px", textAlign: "center"}}>
                                            <strong>Email: </strong>Info@biongenetic.com
                                        </TableCell>
                                        <TableCell sx={{border: "none", fontSize: "12px", textAlign: "center"}}>
                                            <strong>Phone:</strong><br/>+968 2207 3641
                                        </TableCell>
                                    </TableRow>
                                </Table>
                            </TableCell>
                            <TableCell sx={{padding: 0, border: "none"}}>
                                <Stack alignItems="center">
                                    <img src="/images/logo.png" alt="logo" style={{width: "25mm"}}/>
                                    <span style={{fontSize: "1rem", fontWeight: "bolder"}}>
                                    TAX Invoice
                                </span>
                                </Stack>
                            </TableCell>
                            <TableCell sx={{border: "2px solid", padding: 0, width: "80mm"}}>
                                <Table sx={{border: "none", "& td": {paddingX: "10px", paddingY: "5px"}}}>
                                    <TableRow>
                                        <TableCell colSpan={2}
                                                   sx={{border: "none", textAlign: "center", fontSize: "18px"}}>
                                            <span style={{fontWeight: "bolder"}}>مركز مسقط الطبي ش.م.م</span>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{
                                            border: "none",
                                            fontSize: "14px",
                                            textAlign: "right",
                                            direction: "rtl"
                                        }}>
                                            زقاق ۳۷۰۳، رقم ۳۴۶، الغبرة الجنوبية،محافظة مسقط، سلطنة عمان
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell
                                            sx={{border: "none", fontSize: "12px", width: "40mm", textAlign: "center"}}>
                                            <strong>VATIN: </strong>OM1100151715
                                        </TableCell>
                                        <TableCell sx={{border: "none", fontSize: "12px", textAlign: "center"}}>
                                            <strong>CR: </strong>1840770
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell
                                            sx={{
                                                border: "none",
                                                fontSize: "12px",
                                                direction: "rtl",
                                                textAlign: "center"
                                            }}>
                                            <strong>البريد الإلكتروني : </strong>Info@biongenetic.com
                                        </TableCell>
                                        <TableCell
                                            sx={{
                                                border: "none",
                                                fontSize: "12px",
                                                direction: "rtl",
                                                textAlign: "center"
                                            }}>
                                            <strong>هاتف:</strong><br/><span
                                            style={{direction: "ltr"}}>۳۶۴۱ ۲۲۰۷ ۹۶۸+</span>
                                        </TableCell>
                                    </TableRow>
                                </Table>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell colSpan={3} sx={{border: "2px solid", padding: 0}}>
                                <Table>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Invoice: {invoice.invoiceNo}</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Date: {invoiceDate}</strong>
                                        </TableCell>
                                        <TableCell>
                                            <strong>Time: {invoiceTime}</strong>
                                        </TableCell>
                                    </TableRow>
                                </Table>
                            </TableCell>
                        </TableRow>
                    </Table>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{paddingX: 0}}>
                    <Table>
                        <TableRow>
                            <TableCell sx={{padding: 0, width: "105mm", border: "2px solid"}}>
                                <Table sx={{"& td": {paddingY: "5px", border: "none"}}}>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <strong>Client: </strong>{invoice?.owner?.billingInfo?.name ?? invoice.owner.fullName}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <strong>Place of
                                                Supply: </strong>{invoice?.acceptance?.out_patient ? "Out Patient" : "In Bion"}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <strong>Address: </strong>
                                            {address}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Phone: </strong>{invoice.owner?.billingInfo?.phone}
                                        </TableCell>
                                        <TableCell>
                                            <strong>VATIN: </strong>{invoice.owner?.billingInfo?.vatIn}
                                        </TableCell>
                                    </TableRow>
                                </Table>
                            </TableCell>
                            <TableCell sx={{padding: 0, width: "105mm", border: "2px solid"}}>
                                <Table sx={{"& td": {paddingY: "5px", border: "none"}}}>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <strong>Patient: </strong>{invoice?.acceptance?.patient?.fullName}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            <strong>ID/Reference
                                                No.: </strong>{invoice?.acceptance?.referrer_order?.orderInformation?.patient?.reference_id ?? invoice?.acceptance?.referenceCode ?? invoice?.acceptance?.patient?.idNo}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Age: </strong>{invoice?.acceptance?.patient?.age}
                                        </TableCell>
                                        <TableCell>
                                            <strong>Nationality: </strong>{countries.find(item => item.code === invoice?.acceptance?.patient?.nationality)?.label}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>
                                            <strong>Gender: </strong>{invoice?.acceptance?.patient?.gender}
                                        </TableCell>
                                        <TableCell>
                                            <strong>Phone: </strong>{invoice?.acceptance?.patient?.phone}
                                        </TableCell>
                                    </TableRow>
                                </Table>
                            </TableCell>
                        </TableRow>
                    </Table>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{padding: 0}}>
                    <Table sx={{"& td,th": {border: "1px solid", paddingY: "7px", paddingX: "5px"}}}>
                        <TableHead sx={{border: "2px solid", "& th": {textAlign: "center", fontWeight: "900"}}}>
                            <TableRow>
                                <TableCell>
                                    Service Code
                                </TableCell>
                                <TableCell>
                                    Service Name
                                </TableCell>
                                <TableCell>
                                    Qty
                                </TableCell>
                                <TableCell>
                                    Rate (incl.Vat)
                                </TableCell>
                                <TableCell>
                                    Disc
                                </TableCell>
                                <TableCell>
                                    Taxable
                                </TableCell>
                                <TableCell>
                                    VAT Amount
                                </TableCell>
                                <TableCell sx={{width: "11mm"}}>
                                    VAT %
                                </TableCell>
                                <TableCell>
                                    Net Amount
                                </TableCell>
                                <TableCell>
                                    Description
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody sx={{"& td": {paddingY: "1mm"}}}>
                            {invoice?.acceptance_items?.map((item) => <TableRow key={item.id}>
                                <TableCell>{item.test.code}</TableCell>
                                <TableCell>{item.test.name} </TableCell>
                                <TableCell sx={{textAlign: "center"}}>{item.qty}</TableCell>
                                <TableCell sx={{textAlign: "center"}}>{item.unit_price}</TableCell>
                                <TableCell sx={{textAlign: "center"}}>{Math.ceil(item.discount)}</TableCell>
                                <TableCell
                                    sx={{textAlign: "center"}}>{Math.floor(item.price - item.discount)}</TableCell>
                                <TableCell sx={{textAlign: "center"}}>0</TableCell>
                                <TableCell sx={{textAlign: "center"}}>0</TableCell>
                                <TableCell
                                    sx={{textAlign: "center"}}>{Math.floor(item.price - item.discount)}</TableCell>
                                <TableCell
                                    sx={{textAlign: "left"}}>{item.description}</TableCell>
                            </TableRow>)}
                            <TableRow>
                                <TableCell colSpan={3} sx={{fontWeight: "900", textAlign: "center"}}>Total</TableCell>
                                <TableCell/>
                                <TableCell
                                    sx={{textAlign: "center"}}>{Math.ceil(invoice.acceptance_items_sum_discount * 1)}</TableCell>
                                <TableCell
                                    sx={{textAlign: "center"}}>{Math.floor(invoice.acceptance_items_sum_price * 1 - invoice.acceptance_items_sum_discount * 1)}</TableCell>
                                <TableCell sx={{textAlign: "center"}}>0</TableCell>
                                <TableCell sx={{textAlign: "center"}}>0</TableCell>
                                <TableCell
                                    sx={{textAlign: "center"}}>{Math.floor(invoice.acceptance_items_sum_price * 1 - invoice.acceptance_items_sum_discount * 1)}</TableCell>
                                <TableCell/>
                            </TableRow>
                        </TableBody>
                        <TableFooter sx={{"& td": {border: "none", color: "#000", fontWeight: "500"}}}>
                            <TableRow>
                                <TableCell colSpan={5}/>
                                <TableCell colSpan={3}>Total Rate (incl.Vat)(OMR):</TableCell>
                                <TableCell colspan={2}
                                    sx={{textAlign: "center"}}>{Math.floor(invoice.acceptance_items_sum_price * 1)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5}/>
                                <TableCell colSpan={3}>Total Discount (OMR):</TableCell>
                                <TableCell colspan={2}
                                    sx={{textAlign: "center"}}>{Math.ceil(invoice.acceptance_items_sum_discount * 1)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5}/>
                                <TableCell colSpan={3}>Total VAT(OMR):</TableCell>
                                <TableCell colspan={2} sx={{textAlign: "center"}}>0</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell colSpan={5}/>
                                <TableCell colSpan={3}>Total Net Amount (OMR):</TableCell>
                                <TableCell colspan={2}
                                    sx={{textAlign: "center"}}>{Math.floor(invoice.acceptance_items_sum_price * 1 - invoice.acceptance_items_sum_discount * 1)}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell sx={{padding: "0"}}>
                    <Table sx={{"& td": {border: "2px solid"}}}>
                        <TableRow>
                            <TableCell sx={{width: "50%", padding: "0"}}>
                                <Table sx={{"& td": {border: "none", paddingX: "7px", paddingY: "5px"}}}>
                                    <TableRow>
                                        <TableCell colSpan={4} sx={{fontWeight: "bolder"}}>
                                            Payment
                                            Method: {invoice?.patient_payments?.length ? invoice.patient_payments[invoice.patient_payments.length - 1].paymentMethod.toString().toUpperCase() : null}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{width: "50%"}}>
                                            Total Patient Amount (OMR):
                                        </TableCell>
                                        <TableCell sx={{textAlign: "center"}}>
                                            {invoice.has_different_owner ? invoice.patient_payments_sum_price : Math.floor(invoice.acceptance_items_sum_price * 1 - invoice.acceptance_items_sum_discount * 1)}
                                        </TableCell>
                                        <TableCell/>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            Adv.Paid (OMR):
                                        </TableCell>
                                        <TableCell sx={{textAlign: "center"}}>
                                            {advPayment?.price}
                                        </TableCell>
                                        <TableCell>
                                            Date: {advPayment?.date}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            Total Amount to pay (OMR):
                                        </TableCell>
                                        <TableCell sx={{textAlign: "center"}}>
                                            {invoice.has_different_owner ? 0 : Math.floor(invoice.acceptance_items_sum_price * 1 - invoice.acceptance_items_sum_discount * 1 - invoice.patient_payments_sum_price * 1)}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={4}/>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell> Cashier :</TableCell>
                                        <TableCell>{invoice?.patient_payments.length ? invoice.patient_payments[0].cashier?.name : null}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell> Remark :</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </Table>
                            </TableCell>
                            <TableCell sx={{width: "50%", padding: "0"}}>
                                <Table sx={{"& td": {border: "none", paddingX: "7px", paddingY: "5px"}}}>
                                    <TableRow>
                                        <TableCell colSpan={4} sx={{fontWeight: "bolder"}}>
                                            Advance Payment Method: {invoice.has_different_owner ? "CREDIT" : ""}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{width: "50%"}}>
                                            Company Credit (OMR):
                                        </TableCell>
                                        <TableCell sx={{textAlign: "center"}}>
                                            {invoice.has_different_owner ? 0 : ""}
                                        </TableCell>
                                        <TableCell/>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2} sx={{width: "50%"}}>
                                            Total Credit Amount(OMR):
                                        </TableCell>
                                        <TableCell sx={{textAlign: "center"}}>
                                            {invoice.has_different_owner && invoice.sponsor_payments_sum_price ? `-${invoice.sponsor_payments_sum_price ?? 0}` : ""}
                                        </TableCell>

                                        <TableCell/>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell colSpan={2}>
                                            Total Amount to pay (OMR):
                                        </TableCell>
                                        <TableCell sx={{textAlign: "center"}}>
                                            {invoice.has_different_owner && invoice.sponsor_payments_sum_price ? `${invoice.sponsor_payments_sum_price}` : ""}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell> Cashier :</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell> Remark :</TableCell>
                                        <TableCell></TableCell>
                                    </TableRow>
                                </Table>
                            </TableCell>
                        </TableRow>
                    </Table>
                </TableCell>
            </TableRow>
        </Table>
        {invoice.status === "Canceled" ? <Box sx={{
            position: "absolute",
            display: "flex",
            width: "210mm",
            height: "100%",
            top: 0,
            left: 0,
            alignItems: "center",
            justifyContent: "center"
        }}>
            <h1 style={{
                transform: "rotate(315deg)",
                color: "gray",
                fontSize: "40px"
            }}
            >Canceled</h1>
        </Box> : null}
    </>
}
export default Print;
