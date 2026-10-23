import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, WidthType, PageOrientation, ShadingType
} from 'docx'

const reportFont = fileURLToPath(new URL('../../assets/fonts/LiberationSans-Regular.ttf', import.meta.url))
const money = value => `${new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))} ₽`
export const formatCommissionPercent = value => value == null ? '—' : `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(Number(value))}%`
const date = value => new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))

function cell(text, { bold = false, fill = null } = {}) {
  return new TableCell({
    shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
    margins: { top: 110, bottom: 110, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text: String(text), bold, size: 18, font: 'Arial' })] })]
  })
}

function tableRow(values, options = {}) {
  return new TableRow({ cantSplit: true, children: values.map(value => cell(value, options)) })
}

export async function createPartnerOrdersDocx(report) {
  const title = report.title || 'Отчёт по заказам всех партнёров'
  const children = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
    new Paragraph({ text: `Сформирован ${date(new Date())}. Налог рассчитан по ставке 11,412% от оплаченной суммы.`, spacing: { after: 180 } }),
    new Paragraph({ text: `Оплачено: ${money(report.totals.revenue)}    Налог: ${money(report.totals.tax)}    Эквайринг: ${money(report.totals.acquiring)}`, spacing: { after: 80 } }),
    new Paragraph({ text: `Оплаченных заказов: ${report.totals.paidCount}. Оценок эквайринга: ${report.totals.estimatedCount}.`, spacing: { after: 220 } }),
    new Paragraph({ text: 'Эквайринг помечен как фактический либо расчётный. Остаток не учитывает себестоимость и комиссию партнёра.', spacing: { after: 220 } })
  ]

  for (const order of report.orders) {
    children.push(new Paragraph({
      text: `Заказ №${order.id}  ·  ${order.partnerName}`,
      heading: HeadingLevel.HEADING_2,
      keepWithNext: true,
      spacing: { before: 200, after: 80 }
    }))
    children.push(new Paragraph({ text: `${date(order.createdAt)}  ·  ${order.status}  ·  ${order.paymentStatus}  ·  ${order.paymentType || 'Способ неизвестен'}  ·  ${order.promoCode || 'без промокода'}`, spacing: { after: 100 } }))
    if (report.showCustomer) children.push(new Paragraph({ text: `Клиент: ${order.customerName || 'Не указан'}`, spacing: { after: 100 } }))
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tableRow(['Сумма заказа', 'Оплачено', 'Налог 11,412%', 'Эквайринг', 'Остаток'], { bold: true, fill: 'E8EDF7' }),
        tableRow([money(order.total), money(order.revenue), money(order.tax), money(order.acquiring), money(order.balance)])
      ]
    }))
    children.push(new Paragraph({ text: `Источник эквайринга: ${order.acquiringSource}. Комиссия партнёра: ${money(order.commission)} (ставка ${formatCommissionPercent(order.commissionPercentage)}).`, spacing: { before: 80, after: 110 } }))
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        tableRow(['Товар', 'Кол-во', 'Цена', 'Сумма', 'Скидка', 'После скидки'], { bold: true, fill: 'E8EDF7' }),
        ...(order.items.length ? order.items.map(item => tableRow([
          item.title, item.quantity, money(item.price), money(item.gross), money(item.discount), money(item.net)
        ])) : [tableRow(['Нет позиций', '', '', '', '', ''])])
      ]
    }))
  }

  const document = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 20 } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 16838, height: 11906, orientation: PageOrientation.LANDSCAPE },
          margin: { top: 850, right: 850, bottom: 850, left: 850 }
        }
      },
      children
    }]
  })
  return Packer.toBuffer(document)
}

function textWithFont(doc, value, options = {}) {
  doc.font('ReportFont').text(String(value ?? '').replaceAll('₽', 'руб.'), options.x, options.y, {
    width: options.width,
    lineGap: options.lineGap || 0
  })
}

export async function createPartnerOrdersPdf(report) {
  const title = report.title || 'Отчёт по заказам всех партнёров'
  const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: true, info: { Title: title } })
  doc.registerFont('ReportFont', reportFont)
  const chunks = []
  doc.on('data', chunk => chunks.push(chunk))
  const finished = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
  const pageWidth = doc.page.width - 84
  const ensureSpace = height => { if (doc.y + height > doc.page.height - 50) doc.addPage() }
  doc.fillColor('#17223C').fontSize(19)
  textWithFont(doc, title, { x: 42, y: 40, width: pageWidth })
  doc.moveDown(0.35).fontSize(9.5).fillColor('#4B556A')
  textWithFont(doc, `Сформирован ${date(new Date())}. Налог 11,412% от оплаченной суммы.`, { width: pageWidth })
  doc.moveDown(0.6).fontSize(10.5).fillColor('#17223C')
  textWithFont(doc, `Оплачено: ${money(report.totals.revenue)}    Налог: ${money(report.totals.tax)}    Эквайринг: ${money(report.totals.acquiring)}`, { width: pageWidth })
  textWithFont(doc, `Оплаченных заказов: ${report.totals.paidCount}. Оценок эквайринга: ${report.totals.estimatedCount}.`, { width: pageWidth })
  doc.moveDown(0.4).fontSize(8.8).fillColor('#697386')
  textWithFont(doc, 'Остаток не учитывает себестоимость и комиссию партнёра. Эквайринг: фактический либо оценка.', { width: pageWidth })
  doc.moveDown(0.8)

  for (const order of report.orders) {
    ensureSpace(report.showCustomer ? 145 : 125)
    const startY = doc.y
    doc.roundedRect(42, startY, pageWidth, 29, 5).fill('#E8EDF7')
    doc.fillColor('#17223C').fontSize(11)
    textWithFont(doc, `Заказ №${order.id}  ·  ${order.partnerName}`, { x: 50, y: startY + 7, width: pageWidth - 16 })
    doc.y = Math.max(doc.y, startY + 36)
    doc.fillColor('#647087').fontSize(8.5)
    textWithFont(doc, `${date(order.createdAt)}  ·  ${order.status}  ·  ${order.paymentStatus}  ·  ${order.paymentType || 'Способ неизвестен'}  ·  ${order.promoCode || 'без промокода'}`, { x: 50, y: doc.y, width: pageWidth - 16 })
    if (report.showCustomer) textWithFont(doc, `Клиент: ${order.customerName || 'Не указан'}`, { x: 50, y: doc.y, width: pageWidth - 16 })
    doc.moveDown(0.25).fillColor('#17223C').fontSize(9)
    textWithFont(doc, `Сумма: ${money(order.total)}    Оплачено: ${money(order.revenue)}    Налог: ${money(order.tax)}`, { x: 50, y: doc.y, width: pageWidth - 16 })
    textWithFont(doc, `Эквайринг: ${money(order.acquiring)} (${order.acquiringSource})    Остаток: ${money(order.balance)}`, { x: 50, y: doc.y, width: pageWidth - 16 })
    textWithFont(doc, `Комиссия партнёра: ${money(order.commission)} (ставка ${formatCommissionPercent(order.commissionPercentage)})`, { x: 50, y: doc.y, width: pageWidth - 16 })
    doc.moveDown(0.35).fillColor('#4B556A').fontSize(8.5)
    for (const item of order.items) {
      ensureSpace(35)
      textWithFont(doc, `${item.title} × ${item.quantity}  ·  ${money(item.gross)}  ·  скидка ${money(item.discount)}  ·  после скидки ${money(item.net)}`, {
        x: 58, y: doc.y, width: pageWidth - 30, lineGap: 1
      })
    }
    if (!order.items.length) textWithFont(doc, 'Нет позиций', { x: 58, y: doc.y, width: pageWidth - 30 })
    doc.moveDown(1.1)
  }
  if (!report.orders.length) textWithFont(doc, report.emptyMessage || 'Заказов партнёров пока нет.', { width: pageWidth })
  const pages = doc.bufferedPageRange().count
  for (let index = 0; index < pages; index++) {
    doc.switchToPage(index)
    doc.fillColor('#8A93A5').fontSize(8)
    textWithFont(doc, `${index + 1} / ${pages}`, { x: doc.page.width - 90, y: doc.page.height - 30, width: 48 })
  }
  doc.end()
  return finished
}
