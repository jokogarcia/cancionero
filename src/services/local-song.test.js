import { extractOlgaTitleAndType } from './local-song.js';

describe('extractOlgaTitleAndType', () => {
  it('extracts title and type from a .crd path', () => {
    const result = extractOlgaTitleAndType('guitar/tabs/a/guns_n_roses/patience.crd');

    expect(result).toEqual({ title: 'patience', type: 'crd' });
  });

  it('removes .txt extension and trailing OLGA suffixes', () => {
    const result = extractOlgaTitleAndType('artist/this_is_life_ver2_tab.txt');

    expect(result).toEqual({ title: 'this is life', type: 'tab' });
  });

  it('handles gzipped names by stripping .gz and chord suffixes', () => {
    const result = extractOlgaTitleAndType('archive/where_the_streets_have_no_name_crd.gz');

    expect(result).toEqual({ title: 'where the streets have no name', type: 'crd' });
  });

  it('normalizes repeated underscores and spaces in the resulting title', () => {
    const result = extractOlgaTitleAndType('x/hello__beautiful___world_tab.txt');

    expect(result).toEqual({ title: 'hello beautiful world', type: 'tab' });
  });

  it('returns unknown when no OLGA type marker is present', () => {
    const result = extractOlgaTitleAndType('docs/readme.gz');

    expect(result).toEqual({ title: 'readme', type: 'unknown' });
  });
  it('works on a real case',()=>{
    const result = extractOlgaTitleAndType('guitar/tabs/j/ja-je/jason_mraz/0_interest_crd.txt.gz');
    expect(result).toEqual({ title: '0 interest', type: 'crd' });
  })
});