/*
Component: carousel-large
Webflow attribute: data-component="carousel-large"
*/

/**
 * @param {HTMLElement[]} elements - All elements matching [data-component='carousel-large']
 */
export default function (elements) {
  if (typeof Swiper === 'undefined') {
    console.warn('[carousel-large] Swiper not found — skipping')
    return
  }

  const swipers = []

  elements.forEach((el) => {
    const container = el.querySelector('.swiper')
    if (!container) return

    const swiper = new Swiper(container, {
      slidesPerView: 1.15,
      spaceBetween: 16,
      initialSlide: 1,
      centeredSlides: true,
      grabCursor: true,
      rewind: true,
      breakpoints: {
        480: {
          slidesPerView: 1.25,
          spaceBetween: 16,
        },
        768: {
          slidesPerView: 2.15,
          spaceBetween: 20,
        },
        992: {
          slidesPerView: 'auto',
          spaceBetween: 24,
        },
      },
    })

    swipers.push(swiper)
  })

  return {
    resize() {
      swipers.forEach((s) => s.update())
    },
  }
}
