import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { csvCell, ORDER_STATUS, type ShopOrderStatus } from "@/lib/shop"

/** Paid shop orders as a CSV for whoever prepares them (opens in Excel IT). */
export async function GET() {
  const session = await getCurrentSession()
  if (!isAdminEmail(session?.user?.email)) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 })

  const orders = await db.shopOrder.findMany({
    where: { paidAt: { not: null } },
    orderBy: { number: "asc" },
    include: { items: true, player: { select: { name: true } } },
  })
  const header = ["Ordine", "Data", "Stato", "Cliente", "Prodotto", "Taglia", "Quantità", "Totale €", "Consegna", "Nome spedizione", "Indirizzo", "CAP", "Città", "Telefono"]
  const lines = [header.join(";")]
  for (const o of orders) {
    for (const i of o.items) {
      lines.push(
        [
          o.number,
          (o.paidAt ?? o.createdAt).toLocaleDateString("it-IT", { timeZone: "Europe/Rome" }),
          ORDER_STATUS[o.status as ShopOrderStatus]?.label ?? o.status,
          o.player.name,
          i.name,
          i.size,
          i.qty,
          (o.totalCents / 100).toFixed(2).replace(".", ","),
          o.delivery === "SHIP" ? "Spedizione" : "Ritiro",
          o.shipName,
          o.shipAddress,
          o.shipZip,
          o.shipCity,
          o.shipPhone,
        ]
          .map(csvCell)
          .join(";"),
      )
    }
  }
  return new NextResponse("﻿" + lines.join("\r\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="ordini-shop-sander.csv"`,
      "cache-control": "no-store",
    },
  })
}
