/**
 * Department artwork.
 *
 * Photos live in `public/images/departments/` and are served by Vite from the
 * site root. The seed data also carries an `image` field on each department,
 * but the dataset is persisted in `localStorage`, so databases created before
 * that field existed would miss the artwork. This helper keeps a slug -> file
 * map as a fallback so department cards always resolve an image, and so the
 * mapping (including the legacy file names) lives in a single place.
 */

const IMAGE_BY_SLUG = {
  cardiology: '/images/departments/Cardiology.jpg',
  pediatrics: '/images/departments/Pediatrics.jpg',
  dermatology: '/images/departments/Dermatology.jpg',
  neurology: '/images/departments/Neurology.jpg',
  orthopedics: '/images/departments/Orthopedics.jpg',
  dentistry: '/images/departments/dentistry.jpg',
  ophthalmology: '/images/departments/Ophthalmology.jpg',
  'general-medicine': '/images/departments/General%20Medicine.jpg',
}

/**
 * Resolve the background photo for a department.
 * @param {{ image?: string, slug?: string } | null | undefined} department
 * @returns {string | null}
 */
export function getDepartmentImage(department) {
  if (!department) return null
  return department.image || IMAGE_BY_SLUG[department.slug] || null
}
