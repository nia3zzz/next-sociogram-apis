import bcrypt from 'bcryptjs';

const hash = async (
  itemToHash: string | number,
): Promise<string | undefined> => {
  const salt = await bcrypt.genSalt(10);
  try {
    const hashedItem = await bcrypt.hash(itemToHash.toString(), salt);
    return hashedItem;
  } catch (error) {
    console.error('Error hashing item.', error);
    return undefined;
  }
};

const decode = async (
  decodeItem: string | number,
  savedDecodedItem: string,
): Promise<boolean> => {
  try {
    await bcrypt.compare(decodeItem.toString(), savedDecodedItem);
    return true;
  } catch (error) {
    console.error('Error decoding item.', error);
    return false;
  }
};

export { hash, decode };
