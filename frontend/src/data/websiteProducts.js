const descriptions = {
  printedCotton:
    'Pure cotton all-over printed suit with embroidery lines on the shirt, a heavy lace border on the ghera, matching printed bottoms, a full-size printed dupatta, and optional extra laces. Suit material: 5 metres. Dupatta: 2.40 metres.',
  cottonLace:
    'Pure cotton three-piece suit with lace on the neck, empire kali, ghera, and dupatta, paired with tone-to-tone pure cotton bottoms and a full-size lace-finished cotton dupatta.',
  handloom:
    'Pure handloom cotton designer suit with a printed front and back, embroidery on the neck, princess kali, and shirt hemline, indigo cotton bottoms, and a full-size brush-painted mul cotton dupatta.',
  cottonDesigner:
    'Pure cotton designer suit with a printed front and back, lace work on the shirt, printed pure cotton bottoms, and a full-size printed cotton dupatta.',
  lucknowiHeavy:
    'Heavy Lucknowi wedding-series suit in pure tissue fabric, with dense embroidery on the shirt and dupatta and tone-to-tone cotton silk bottoms.',
  lucknowiTissue:
    'Lucknowi suit in pure tissue fabric with embroidery on the shirt and sleeves, scattered embroidered booties, a dupatta with two embroidered borders, and tone-to-tone cotton silk bottoms.',
  cottonWhite:
    'Pure cotton designer suit with an embroidered neckline and shirt front, embroidered pure cotton bottoms, and a full-size embroidered cotton dupatta.',
  chanderi:
    'Pure mul chanderi three-piece suit with all-over embroidery on the shirt and dupatta, heavy patch work on the ghera, tone-to-tone shantoon bottoms, and a full-size embroidered chanderi dupatta. Each piece measures approximately 2.5 metres.',
  lucknowiMul:
    'Lucknowi suit in pure mul cotton with hand embroidery on the shirt and dupatta, soft tone-to-tone cotton rayon bottoms, and a full-size hand-embroidered mul cotton dupatta.',
  haqoba:
    'Semi-party-wear Lucknowi three-piece suit in pure cotton haqoba chikan with block printing on the front and back, lace work on the shirt, extra sleeve fabric, ivory cotton rayon bottoms, and a full-size block-printed lace-finished cotton dupatta. Each piece measures approximately 2.5 metres.',
  muslin:
    'Semi-party-wear pure muslin digital-print three-piece suit with hand work on the ghera, booties across the shirt, extra sleeve fabric, tone-to-tone shantoon bottoms, and a full-size lace-finished digital-print chiffon dupatta. Each piece measures approximately 2.5 metres.',
  maheshwari:
    'Pure Maheshwari cotton silk printed three-piece unstitched suit with extra sleeve fabric and borders, an embroidered T neckline, tone-to-tone cotton rayon bottoms, and a full-size printed Maheshwari dupatta. Suitable for all seasons and semi-party wear.',
  printedCottonHeavy:
    'Pure cotton all-over printed suit with embroidered booties across the shirt, a heavy embroidered ghera border, matching printed bottoms, and a full-size printed cotton dupatta. Suit material: 5 metres. Dupatta: 2.40 metres.',
  jamdani:
    'Bengali Art three-piece unstitched Jamdani suit in pure mul cotton, with hand weaving on the shirt and dupatta, extra hand-woven sleeve fabric, tone-to-tone cotton bottoms, and a full-size hand-woven dupatta. Shirt: 3 metres; bottoms: 2.5 metres; dupatta: 2.5+ metres.',
  mulDigital:
    'Pure mul cotton three-piece unstitched suit with block and digital printing on the front and back, hand work on the shirt, extra sleeve fabric, soft ivory khadi cotton bottoms, and a full-size block-and-digital printed lace-finished mul cotton dupatta.',
  linen:
    'Pure linen cotton three-piece unstitched suit with digital printing on the front and back, hand work on the shirt, extra sleeve fabric, black satin rayon bottoms, and a full-size digital-print lace-finished linen cotton dupatta.',
  brushPaint:
    'Pure cotton three-piece unstitched suit with lace work and brush-paint printing on the shirt, dupatta, and sleeves, tone-to-tone cotton bottoms, and a full-size lace-finished brush-painted dupatta.',
  mulBlock:
    'Pure mul cotton three-piece unstitched suit with a block-printed front and back, shirt embroidery, extra sleeve fabric, white cotton bottoms, and a full-size block-printed dupatta finished with heavy lace on all four sides.',
  mulLace:
    'Pure mul cotton three-piece unstitched suit with a printed shirt, heavy lace work, extra sleeve fabric, contrast green cotton bottoms, and a full-size brush-painted finished cotton dupatta.',
  bengaliChanderi:
    'Bengali Art three-piece unstitched suit in pure mul chanderi with hand weaving on the shirt and dupatta, extra embroidered sleeve fabric, tone-to-tone cotton bottoms, and a full-size hand-woven chanderi dupatta.',
}

const rows = [
  ['Pure cotton all over printed suit - ice blue colour', 'LP7055007', '101-G', 'printedCotton', 7, 2600, 2200, 'Printed Cotton Suits'],
  ['Pure cotton all over printed suit - pink colour', 'LP7055007', '102-F', 'printedCotton', 6, 2600, 2200, 'Printed Cotton Suits'],
  ['Pure cotton all over printed suit - green colour', 'LP7055007', '103-D', 'printedCotton', 4, 2600, 2200, 'Printed Cotton Suits'],
  ['Pure cotton 3pc suit', 'LP7085007', '105-C', 'cottonLace', 3, 3200, 2700, 'Cotton Suits'],
  ['Pure cotton 3pc suit', 'LP7085007', '106-G', 'cottonLace', 7, 3200, 2700, 'Cotton Suits'],
  ['Pure cotton 3pc suit', 'LP7085007', '104-D', 'cottonLace', 4, 3200, 2700, 'Cotton Suits'],
  ['Pure cotton 3pc suit', 'LP7085007', '107-D', 'cottonLace', 4, 3200, 2700, 'Cotton Suits'],
  ['Pure handloom cotton suit - Indigo & white colour', 'LP7115007', '108-G', 'handloom', 7, 4500, 3825, 'Handloom Suits'],
  ['Pure cotton designer suit - black & pink colour', 'LP115007', '109-F', 'cottonDesigner', 6, 4000, 3400, 'Cotton Suits'],
  ['Lucknowi suit - pure tissue heavy - wedding series', 'LP265007', '110-E', 'lucknowiHeavy', 5, 9000, 7650, 'Lucknowi Suits'],
  ['Lucknowi suit - pure tissue heavy - wedding series', 'LP265007', '111-H', 'lucknowiHeavy', 8, 9000, 7650, 'Lucknowi Suits'],
  ['Lucknowi suit - pure tissue fabric of shirt & dupatta', 'LP7265007', '112-E', 'lucknowiTissue', 5, 7800, 6600, 'Lucknowi Suits'],
  ['Lucknowi suit - pure tissue fabric of shirt & dupatta', 'LP7265007', '113-D', 'lucknowiTissue', 4, 7800, 6600, 'Lucknowi Suits'],
  ['Lucknowi suit - pure tissue fabric of shirt & dupatta', 'LP7265007', '114-D', 'lucknowiTissue', 4, 7800, 6600, 'Lucknowi Suits'],
  ['Lucknowi suit - pure tissue fabric of shirt & dupatta', 'LP7265007', '115-E', 'lucknowiTissue', 5, 7800, 6600, 'Lucknowi Suits'],
  ['Pure cotton designer suit - white colour', 'LP7115007', '116-4', 'cottonWhite', 4, 4200, 3600, 'Cotton Suits'],
  ['Pure mul chanderi suit - lavender colour', 'LP7115007', '117-D', 'chanderi', 4, 4500, 3800, 'Chanderi Suits'],
  ['Pure mul chanderi suit - olive green colour', 'LP7115007', '118-F', 'chanderi', 6, 4500, 3800, 'Chanderi Suits'],
  ['Pure mul chanderi suit - blue colour', 'LP115007', '119-E', 'chanderi', 5, 4500, 3800, 'Chanderi Suits'],
  ['Pure mul chanderi suit - pink colour', 'LP7115007', '120-D', 'chanderi', 4, 4500, 3800, 'Chanderi Suits'],
  ['Lucknowi suit - light rust colour', 'LP7195007', '121-G', 'lucknowiMul', 7, 7000, 5960, 'Lucknowi Suits'],
  ['Pure cotton haqoba chikan in block printing - blue', 'LP7085007', '122-E', 'haqoba', 5, 3200, 2700, 'Lucknowi Suits'],
  ['Pure cotton haqoba chikan in block printing - pink', 'LP7085007', '123-F', 'haqoba', 6, 3200, 2700, 'Lucknowi Suits'],
  ['Pure cotton haqoba chikan in block printing - yellow', 'LP7085007', '124-F', 'haqoba', 6, 3200, 2700, 'Lucknowi Suits'],
  ['Pure muslin digital print - olive green colour', 'LP7135007', '125-K', 'muslin', 11, 4250, 3600, 'Muslin Suits'],
  ['Pure muslin digital print - pink colour', 'LP7135007', '126-H', 'muslin', 8, 4250, 3600, 'Muslin Suits'],
  ['Pure Maheshwari cotton silk print - blue colour', 'LP7085507', '127-J', 'maheshwari', 10, 3200, 2700, 'Maheshwari Suits'],
  ['Pure Maheshwari cotton silk print - gold colour', 'LP7085507', '128-G', 'maheshwari', 7, 3200, 2700, 'Maheshwari Suits'],
  ['Pure Maheshwari cotton silk print - pink colour', 'LP7085507', '129-F', 'maheshwari', 6, 3200, 2700, 'Maheshwari Suits'],
  ['Pure cotton all over printed suit - yellow colour', 'LP7065007', '130-G', 'printedCottonHeavy', 7, 2850, 2400, 'Printed Cotton Suits'],
  ['Bengali Art 3pc unstitched Jamdani suit', 'LP7265007', '131-I', 'jamdani', 9, 7500, 6400, 'Bengali Art Suits'],
  ['Pure mul cotton 3pc unstitched suit', 'LP7125507', '132-E', 'mulDigital', 5, 5500, 4700, 'Mul Cotton Suits'],
  ['Pure mul cotton 3pc unstitched suit', 'LP7125507', '133-E', 'mulDigital', 5, 5500, 4700, 'Mul Cotton Suits'],
  ['Pure mul cotton 3pc unstitched suit', 'LP7125507', '134-E', 'mulDigital', 5, 5500, 4700, 'Mul Cotton Suits'],
  ['Pure mul cotton 3pc unstitched suit', 'LP7125507', '135-E', 'mulDigital', 5, 5500, 4700, 'Mul Cotton Suits'],
  ['Pure linen cotton 3pc unstitched suit', 'LP7085007', '136-E', 'linen', 5, 4250, 3600, 'Linen Cotton Suits'],
  ['Pure linen cotton 3pc unstitched suit', 'LP7085007', '137-F', 'linen', 6, 4500, 3800, 'Linen Cotton Suits'],
  ['Pure cotton 3pc unstitched suit - powder pink', 'LP7105007', '138-I', 'brushPaint', 9, 3900, 3300, 'Cotton Suits'],
  ['Pure cotton 3pc unstitched suit - pista green', 'LP7105007', '139-E', 'brushPaint', 5, 3900, 3300, 'Cotton Suits'],
  ['Pure cotton 3pc unstitched suit - beige colour', 'LP7105007', '140-G', 'brushPaint', 7, 3900, 3300, 'Cotton Suits'],
  ['Pure cotton 3pc unstitched suit - grey colour', 'LP7105007', '141-F', 'brushPaint', 6, 3900, 3300, 'Cotton Suits'],
  ['Pure mul cotton 3pc unstitched suit - white & blue', 'LP7105007', '142-E', 'mulBlock', 5, 4500, 3800, 'Mul Cotton Suits'],
  ['Pure mul cotton 3pc unstitched suit - white & purple', 'LP7105007', '143-E', 'mulBlock', 5, 4500, 3800, 'Mul Cotton Suits'],
  ['Pure mul cotton 3pc unstitched suit - multi/fuchsia pink', 'LP7115007', '144-F', 'mulLace', 6, 4400, 3700, 'Mul Cotton Suits'],
  ['Pure mul cotton 3pc unstitched suit - blue/green', 'LP7115007', '145-G', 'mulLace', 7, 4400, 3700, 'Mul Cotton Suits'],
  ['Bengali Art 3pc unstitched suit - pure mul chanderi', 'LP7125007', '146-D', 'bengaliChanderi', 4, 3900, 3300, 'Bengali Art Suits'],
]

const productMediaMap = {
  '101-G': { images: ['101E.jpeg', '101A.jpeg', '101B.jpeg', '101D.jpeg', '101F.jpeg'], videos: ['101C.mp4'] },
  '102-F': { images: ['102A.jpeg', '102B.jpeg', '102C.jpeg', '102D.jpeg', '102F.jpeg'], videos: ['102E.mp4'] },
  '103-D': { images: ['103D.png', '103A.jpeg', '103B.jpeg'], videos: ['103C.mp4'] },
  '105-C': { images: ['105A.jpeg', '105B.jpeg'], videos: ['105C.mp4'] },
  '106-G': { images: ['106E.jpeg', '106A.jpeg', '106B.jpeg', '106D.jpeg', '106F.jpeg', '106G.jpeg'], videos: ['106C.mp4'] },
  '104-D': { images: ['104A.jpeg', '104B.jpeg', '104C.png', '104D.png'], videos: [] },
  '107-D': { images: ['107D.png', '107A.jpeg', '107B.jpeg'], videos: ['107C.mp4'] },
  '108-G': { images: ['108E.png', '108A.jpeg', '108B.jpeg', '108C.jpeg', '108F.png', '108G.png'], videos: ['108D.mp4'] },
  '109-F': { images: ['109F.png', '109A.jpeg', '109B.jpeg', '109C.jpeg', '109D.png', '109E.png'], videos: [] },
  '110-E': { images: ['110A.jpeg'], videos: ['110E.mp4'] },
  '111-H': { images: ['111F.png', '111A.jpeg', '111B.jpeg', '111G.png', '111H.png'], videos: ['111E.mp4'] },
  '112-E': { images: ['112A.jpeg', '112B.jpeg'], videos: ['112E.mp4'] },
  '113-D': { images: ['113A.jpeg', '113B.jpeg'], videos: ['113E.mp4'] },
  '114-D': { images: [], videos: ['114D.mp4'] },
  '115-E': { images: ['115A.jpeg', '115B.jpeg'], videos: ['115E.mp4'] },
  '116-4': { images: ['116A.jpeg', '116B.jpeg', '116C.jpeg'], videos: ['116D.mp4'] },
  '117-D': { images: ['117B.jpeg', '117C.jpeg'], videos: ['117D.mp4'] },
  '118-F': { images: ['118E.png', '118A.jpeg', '118B.jpeg', '118C.jpeg', '118F.png'], videos: ['118D.mp4'] },
  '119-E': { images: ['119A.jpeg', '119B.jpeg', '119C.jpeg'], videos: ['119E.mp4'] },
  '120-D': { images: ['120A.jpeg', '120B.jpeg'], videos: ['120D.mp4'] },
  '121-G': { images: ['121E.png', '121A.jpeg', '121B.jpeg', '121C.jpeg', '121D.png', '121F.png', '121G.png'], videos: [] },
  '122-E': { images: ['122A.jpeg', '122B.jpeg', '122C.jpeg', '122D.jpeg'], videos: ['122E.mp4'] },
  '123-F': { images: ['123A.jpeg', '123B.jpeg', '123C.jpeg'], videos: ['123F.mp4'] },
  '124-F': { images: ['124A.jpeg', '124B.jpeg', '124C.jpeg'], videos: ['124F.mp4'] },
  '125-K': { images: ['125H.png', '125A.jpeg', '125B.jpeg', '125C.jpeg', '125D.jpeg', '125I.png', '125J.png', '125K.png'], videos: ['125G.mp4'] },
  '126-H': { images: ['126F.png', '126A.jpeg', '126B.jpeg', '126G.png', '126H.png'], videos: ['126E.mp4'] },
  '127-J': { images: ['127G.png', '127A.jpeg', '127B.jpeg', '127C.jpeg', '127F.png', '127H.png', '127I.png', '127J.png'], videos: ['127E.mp4'] },
  '128-G': { images: ['128E.png', '128A.jpeg', '128B.jpeg', '128C.jpeg', '128F.png', '128G.png'], videos: ['128D.mp4'] },
  '129-F': { images: ['129F.png', '129A.jpeg', '129B.jpeg', '129C.jpeg', '129E.png'], videos: ['129D.mp4'] },
  '130-G': { images: ['130E.png', '130A.jpeg', '130B.jpeg', '130C.jpeg', '130F.png', '130G.png'], videos: ['130D.mp4'] },
  '131-I': { images: ['131D.png', '131A.jpeg', '131B.jpeg', '131C.jpeg', '131E.png', '131F.png', '131G.png', '131H.png', '131I.png'], videos: [] },
  '132-E': { images: ['132A.jpeg', '132B.jpeg', '132C.jpeg'], videos: ['132E.mp4'] },
  '133-E': { images: ['133A.jpeg', '133B.jpeg', '133C.jpeg'], videos: ['133E.mp4'] },
  '134-E': { images: ['134A.jpeg', '134B.jpeg', '134C.jpeg'], videos: ['134E.mp4'] },
  '135-E': { images: ['135A.jpeg', '135B.jpeg', '135C.jpeg'], videos: ['135E.mp4'] },
  '136-E': { images: ['136A.jpeg', '136B.jpeg', '136C.jpeg'], videos: ['136E.mp4'] },
  '137-F': { images: ['137A.jpeg', '137B.jpeg', '137C.jpeg', '137D.jpeg'], videos: ['137F.mp4'] },
  '138-I': { images: ['138F.png', '138A.jpeg', '138B.jpeg', '138C.jpeg', '138G.png', '138H.png', '138I.png'], videos: ['138E.mp4'] },
  '139-E': { images: ['139A.jpeg', '139B.jpeg', '139C.jpeg'], videos: ['139E.mp4'] },
  '140-G': { images: ['140F.png', '140A.jpeg', '140B.jpeg', '140C.jpeg', '140G.png'], videos: ['140E.mp4'] },
  '141-F': { images: ['141F.png', '141A.jpeg', '141B.jpeg', '141C.jpeg'], videos: ['141E.mp4'] },
  '142-E': { images: ['142A.jpeg', '142B.jpeg', '142C.jpeg'], videos: ['142E.mp4'] },
  '143-E': { images: ['143A.jpeg', '143B.jpeg', '143C.jpeg'], videos: ['143E.mp4'] },
  '144-F': { images: ['144A.jpeg', '144B.jpeg', '144C.jpeg', '144D.jpeg'], videos: ['144F.mp4'] },
  '145-G': { images: ['145A.jpeg', '145B.jpeg', '145C.jpeg'], videos: ['145G.mp4'] },
  '146-D': { images: ['146A.jpeg', '146B.jpeg', '146C.jpeg'], videos: ['146D.mp4'] },
}

export const websiteProducts = rows.map(
  ([name, productId, productCode, descriptionKey, imageCount, originalPrice, price, category], index) => {
    const media = productMediaMap[productCode] || { images: [], videos: [] }
    const images = media.images.length ? media.images : [`product-${(index % 12) + 1}.svg`]
    const videos = media.videos.length ? media.videos : []

    return {
      name,
      productId,
      productCode,
      description: descriptions[descriptionKey],
      imageCount,
      originalPrice,
      discount: 15,
      price,
      category,
      stock: 10,
      image: images[0],
      images,
      video: videos[0] || null,
      videos,
      sortOrder: index + 1,
    }
  },
)

export const websiteCategories = [...new Set(websiteProducts.map((product) => product.category))]
