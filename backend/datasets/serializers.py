from rest_framework import serializers


class DatasetSerializer(serializers.Serializer):
    id = serializers.CharField(read_only=True)
    name = serializers.CharField(read_only=True)
    uploadedAt = serializers.CharField(read_only=True)
    totalCount = serializers.IntegerField(read_only=True)
    avgFlowrate = serializers.FloatField(read_only=True)
    avgPressure = serializers.FloatField(read_only=True)
    avgTemperature = serializers.FloatField(read_only=True)
    pinned = serializers.BooleanField(read_only=True, default=False)


class DatasetWithEquipmentSerializer(DatasetSerializer):
    equipment = serializers.ListField(child=serializers.DictField(), read_only=True)


class SummaryStatsSerializer(serializers.Serializer):
    totalEquipment = serializers.IntegerField()
    avgFlowrate = serializers.FloatField()
    avgPressure = serializers.FloatField()
    avgTemperature = serializers.FloatField()
    typeDistribution = serializers.DictField(child=serializers.IntegerField())
    flowrateRange = serializers.DictField()
    pressureRange = serializers.DictField()
    temperatureRange = serializers.DictField()
