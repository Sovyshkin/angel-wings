function getFieldLabel(field) {
  const labels = {
    slug: 'URL-адрес',
    email: 'Email',
    sku: 'Артикул',
    code: 'Код',
    phone: 'Телефон'
  }

  return labels[field] || field
}

function getPrismaErrorMessage(err) {
  if (err.code === 'P2002') {
    const fields = Array.isArray(err.meta?.target) ? err.meta.target : []
    const fieldText = fields.length
      ? fields.map(getFieldLabel).join(', ')
      : 'значение'

    if (fields.includes('slug')) {
      return 'Такой URL-адрес уже занят. Попробуйте другое название.'
    }

    return `Такое значение уже используется: ${fieldText}.`
  }

  if (err.code === 'P2003') {
    return 'Запись связана с другими данными и не может быть удалена. Сначала уберите связанные товары или заказы.'
  }

  if (err.code === 'P2025') {
    return 'Запись не найдена или уже была удалена.'
  }

  if (err.name === 'PrismaClientValidationError') {
    return 'Некорректные данные. Проверьте заполненные поля и попробуйте снова.'
  }

  return null
}

export const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err)

  if (err.code === 'EMAIL_DELIVERY_FAILED' || err.name === 'EmailDeliveryError') {
    return res.status(503).json({
      error: 'Не удалось отправить письмо. Почтовый сервис временно недоступен, попробуйте ещё раз через несколько минут.',
      code: 'EMAIL_DELIVERY_FAILED',
      deliveryCode: err.deliveryCode || null,
      reason: err.publicReason || null
    })
  }

  const prismaMessage = getPrismaErrorMessage(err)
  if (prismaMessage) {
    return res.status(400).json({
      error: prismaMessage
    })
  }
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Проверьте заполненные поля',
      details: err.message
    })
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Нужно войти в аккаунт',
      message: err.message
    })
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  })
}
