const segmentKeys = {
  production: 'dxul6twMnfpyguF8w4W2qUpFnhxEUSV6',
  dev: 'Ha0swpI6s2CVEMxK84cEmKmUVmBa1USu',
};

export const segmentKey =
  (process.env.NODE_ENV === 'production') & (process.env.CONFIGURATOR_ENV === 'production')
    ? segmentKeys['production']
    : segmentKeys['dev'];
