// Public events. Facts only, no inflation: a booth is a booth, not a talk.
//
// T&TMA 2026: 3 Stripes Technologies exhibited (booth) at the T&TMA Medical
// Research Conference on 11 October 2026. 3ST did NOT present or speak at the
// 2026 event. Keep it that way in every piece of copy that uses this record.
//
// PHOTOS: Antonio is supplying conference photos later. To publish them:
//   1. Put the optimised images in public/images/events/ttma-2026/
//   2. Add one entry per image to `photos` below: { src, alt, caption? }
// The gallery renders the real photos as soon as `photos` is non-empty, and
// clearly-marked placeholders until then. Do not add stock or generated images.

export interface EventPhoto {
  src: string;
  alt: string;
  caption?: string;
}

export interface PublicEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  dateISO: string;
  location: string;
  role: 'Exhibitor';
  summary: string;
  photos: EventPhoto[];
  placeholderSlots: number;
}

export const TTMA_2026: PublicEvent = {
  id: 'ttma-2026',
  name: 'T&TMA Medical Research Conference 2026',
  shortName: 'T&TMA 2026',
  date: '11 October 2026',
  dateISO: '2026-10-11',
  location: 'Port of Spain, Trinidad and Tobago',
  role: 'Exhibitor',
  summary:
    '3 Stripes Technologies (3ST) exhibited with a booth at the Trinidad and Tobago Medical Association\'s 2026 Medical Research Conference. V2 of the EMR was first presented at an earlier edition of the same conference; this year 3ST came back with V3, showing it to doctors and practice teams and talking through where automation fits in a clinic.',
  photos: [],
  placeholderSlots: 3,
};
