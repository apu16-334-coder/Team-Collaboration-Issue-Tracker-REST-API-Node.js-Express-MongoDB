const abortAndNext = async (session, next, error) => {
    await session.abortTransaction();
    await session.endSession();
    return next(error);
}

module.exports = abortAndNext;