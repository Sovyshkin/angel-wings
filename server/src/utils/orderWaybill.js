import { fileURLToPath } from 'node:url'
import PDFDocument from 'pdfkit'
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle
} from 'docx'

const fontPath = fileURLToPath(new URL('../../assets/fonts/LiberationSans-Regular.ttf', import.meta.url))
const seller = {
  name: 'ИП Кириллов Никита Сергеевич',
  inn: '773323389224',
  ogrn: '325774600301379',
  address: '125362, Россия, г. Москва, ул. Тушинская, д. 13, кв. 70',
  email: 'info@angel-wings.ru'
}
const rub = value => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
const cents = value => Math.round((Number(value) || 0) * 100)

export function buildOrderWaybill(order) {
  const items = (order.items || []).map((item, index) => ({
    number: index + 1,
    name: `${item.product?.title || `Товар #${item.productId}`}${item.dosage ? `, ${item.dosage}` : ''}`,
    quantity: Number(item.quantity) || 0,
    price: cents(item.price),
    sum: Math.round((Number(item.quantity) || 0) * cents(item.price))
  }))
  const goods = items.reduce((sum, item) => sum + item.sum, 0)
  const delivery = order.deliveryTariffCode || order.deliveryPickupPoint ? 0 : cents(order.deliveryPrice)
  const total = cents(order.total)
  // The recorded order total is authoritative, including promotions and spent points.
  const discount = goods + delivery - total
  return {
    number: order.id,
    date: new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Moscow' }).format(new Date(order.createdAt)),
    seller,
    buyer: [order.customerName, order.shippingAddress, order.customerPhone].filter(Boolean).join(', '),
    payment: String(order.paymentStatus || '').toUpperCase() === 'PAID' ? 'Оплачен' : 'Не оплачен',
    items, goods, delivery, discount, total,
    vat: Math.round(total * 5 / 105)
  }
}

const p = (text, options = {}) => new Paragraph({
  spacing: { after: options.after ?? 100 },
  alignment: options.align,
  children: [new TextRun({ text: String(text), bold: options.bold, size: options.size || 20, font: 'Arial' })]
})
const cell = (text, options = {}) => new TableCell({
  margins: { top: 85, bottom: 85, left: 80, right: 80 },
  children: [p(text, { bold: options.bold, size: 17, after: 0, align: options.align })]
})
const row = (values, options = {}) => new TableRow({
  cantSplit: true,
  children: values.map((value, index) => cell(value, { ...options, align: index > 0 ? AlignmentType.RIGHT : undefined }))
})

export async function createOrderWaybillDocx(data) {
  const rows = [
    row(['№ / Товар', 'Кол-во', 'Цена, ₽', 'Сумма, ₽'], { bold: true }),
    ...data.items.map(item => row([`${item.number}. ${item.name}`, `${item.quantity} шт.`, rub(item.price / 100), rub(item.sum / 100)]))
  ]
  const document = new Document({
    sections: [{
      properties: { page: { margin: { top: 900, bottom: 900, left: 850, right: 850 } } },
      children: [
        p(`Накладная № ${data.number} от ${data.date}`, { bold: true, size: 32, after: 260 }),
        p(`Поставщик: ${data.seller.name}`, { bold: true }),
        p(`ИНН ${data.seller.inn} · ОГРНИП ${data.seller.ogrn}`),
        p(`${data.seller.address} · ${data.seller.email}`, { after: 180 }),
        p(`Покупатель: ${data.buyer || 'Не указан'}`, { after: 160 }),
        p(`Статус оплаты: ${data.payment}`, { after: 200 }),
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, columnWidths: [5500, 1300, 1700, 1700], rows }),
        p(`Товаров: ${data.items.length} · Сумма товаров: ${rub(data.goods / 100)} ₽`, { after: 70 }),
        ...(data.delivery ? [p(`Доставка: ${rub(data.delivery / 100)} ₽`, { after: 70 })] : []),
        ...(data.discount ? [p(`${data.discount > 0 ? 'Скидка и списанные баллы' : 'Корректировка суммы заказа'}: ${rub(Math.abs(data.discount) / 100)} ₽`, { after: 70 })] : []),
        p(`Итого: ${rub(data.total / 100)} ₽`, { bold: true, size: 25, after: 70 }),
        p(`В том числе НДС 5%: ${rub(data.vat / 100)} ₽`, { after: 300 }),
        p('Передал: ____________________       Получил: ____________________', { after: 140 }),
        p('Документ сформирован автоматически. Подписи заполняются при передаче товара.', { size: 16 })
      ]
    }]
  })
  return Packer.toBuffer(document)
}

export async function createOrderWaybillPdf(data) {
  const doc = new PDFDocument({ size: 'A4', margin: 42, info: { Title: `Накладная № ${data.number}` } })
  doc.registerFont('Cyrillic', fontPath).font('Cyrillic')
  const chunks = []
  doc.on('data', chunk => chunks.push(chunk))
  const result = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
  const left = 42
  const width = doc.page.width - 84
  const pdfText = value => String(value).replaceAll('₽', 'руб.')
  const write = (text, size = 10, color = '#202633') => doc.font('Cyrillic').fontSize(size).fillColor(color).text(pdfText(text), left, doc.y, { width })
  const ensure = height => { if (doc.y + height > doc.page.height - 65) doc.addPage() }
  write(`Накладная № ${data.number} от ${data.date}`, 18)
  doc.moveDown(0.8)
  write(`Поставщик: ${data.seller.name}`)
  write(`ИНН ${data.seller.inn} · ОГРНИП ${data.seller.ogrn}`, 9)
  write(`${data.seller.address} · ${data.seller.email}`, 9)
  doc.moveDown(0.5)
  write(`Покупатель: ${data.buyer || 'Не указан'}`)
  write(`Статус оплаты: ${data.payment}`, 9)
  doc.moveDown(0.8)
  const columns = [left + 7, left + width * 0.62, left + width * 0.74, left + width * 0.86]
  const widths = [width * 0.6, width * 0.11, width * 0.11, width * 0.12]
  const drawRow = (values, header = false) => {
    const heights = values.map((value, index) => doc.heightOfString(pdfText(value), { width: widths[index], align: index ? 'right' : 'left' }))
    const height = Math.max(24, ...heights.map(n => n + 10))
    ensure(height + 2)
    const y = doc.y
    if (header) doc.rect(left, y, width, height).fill('#EAF0FA')
    doc.rect(left, y, width, height).strokeColor('#CBD4E1').lineWidth(0.5).stroke()
    values.forEach((value, index) => doc.font('Cyrillic').fontSize(8.5).fillColor('#202633').text(pdfText(value), columns[index], y + 5, { width: widths[index], align: index ? 'right' : 'left' }))
    doc.y = y + height
  }
  doc.fontSize(8.5)
  drawRow(['№ / Товар', 'Кол-во', 'Цена', 'Сумма'], true)
  for (const item of data.items) drawRow([`${item.number}. ${item.name}`, `${item.quantity} шт.`, rub(item.price / 100), rub(item.sum / 100)])
  doc.moveDown(1)
  ensure(115)
  write(`Товаров: ${data.items.length} · Сумма товаров: ${rub(data.goods / 100)} ₽`, 9)
  if (data.delivery) write(`Доставка: ${rub(data.delivery / 100)} ₽`, 9)
  if (data.discount) write(`${data.discount > 0 ? 'Скидка и списанные баллы' : 'Корректировка суммы заказа'}: ${rub(Math.abs(data.discount) / 100)} ₽`, 9)
  write(`Итого: ${rub(data.total / 100)} ₽`, 13)
  write(`В том числе НДС 5%: ${rub(data.vat / 100)} ₽`, 9)
  doc.moveDown(2)
  ensure(60)
  write('Передал: ____________________       Получил: ____________________', 10)
  doc.moveDown(0.5)
  write('Документ сформирован автоматически. Подписи заполняются при передаче товара.', 8, '#647083')
  doc.end()
  return result
}
