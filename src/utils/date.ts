import { format } from 'date-fns'

export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), 'MMMM d, yyyy')
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}
