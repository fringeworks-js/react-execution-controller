import indexes from '@niche-works/dev/indexes';
import {
  CONSTANTS,
  PRIVATE,
  TEST_FILE,
} from '@niche-works/dev/indexes/constants';

indexes({
  exclude: [CONSTANTS, PRIVATE, TEST_FILE],
});
